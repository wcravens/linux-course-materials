// Course build runner.
//
//   course <command> [-c <course>] [selector...]
//
// Lecture selectors name a lecture by number (`01`), slug (`what-is-linux`), or
// full directory name. `build`, `export`, and `notes` operate on every lecture
// when given none.
//
// Which course they operate on is decided by `selectCourses()`: the cwd when it
// sits inside one, `-c` when it does not, every course when neither says
// otherwise. `-c` is a flag rather than a second positional argument so that the
// lecture-selector grammar stays exactly as it was.

import { spawn } from 'node:child_process'
import { readFile, writeFile, cp, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  packageRoot,
  resolveSelector,
  resolveSelectors,
  entryLabel,
  formatEntryList,
  SelectorError
} from './content.mjs'
import { discoverLectures } from './lectures.mjs'
import { discoverModules, MODULES_DIRNAME } from './modules.mjs'
import {
  COURSES_DIRNAME,
  courseCodeLabel,
  findWorkspaceRoot,
  selectCourses,
  slidevBin
} from './courses.mjs'
import { buildDocument } from './notes.mjs'
import { writeIndex } from './index.mjs'

const LECTURE_TEMPLATE_DIR = path.join(packageRoot, 'templates', 'lecture')
const MODULE_TEMPLATE_DIR = path.join(packageRoot, 'templates', 'module')

const USAGE = `Usage: course <command> [-c <course>] [selector...]

Commands:
  dev <selector>        Start the Slidev dev server for one lecture or module
  build [selector...]   Build slides, PDFs, prose documents, and the course index
  export [selector...]  Export slide PDFs only
  notes [selector...]   Render abstracts, tutorials, notes, and lab documents
  new <NN> <title>      Scaffold a new lecture from the kit's template
  new --module <slug> <title>
                        Scaffold a new shared module under modules/
  list                  List courses, their lectures, and their modules

Selectors match a lecture by number, slug, or directory name:
  01    what-is-linux    01-what-is-linux

and a module by its directory name:
  markdown    gcp-vm

-c, --course <selector> matches by code, slug, or directory name:
  csc-118    csc118    intro-to-linux    csc-118-intro-to-linux

Run from inside a course directory and that course is implied. Above one,
build, export, notes, and list cover every course; dev and new need -c.
Modules live at the workspace root and are included by name in a course.json.
`

class UserError extends Error {}

/** Argument problems get a bare message; anything else gets a stack trace. */
const isUserFacing = (error) => error instanceof UserError || error instanceof SelectorError

function log (message) {
  process.stdout.write(`${message}\n`)
}

/** Run a command, inheriting stdio, and reject on a non-zero exit. */
function run (command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`${path.basename(command)} killed by ${signal}`))
      if (code !== 0) return reject(new Error(`${path.basename(command)} exited with code ${code}`))
      resolve()
    })
  })
}

/** Pull `-c <selector>`, `--course <selector>`, or `--course=<selector>` out of
    the argument list, wherever it appears, leaving the lecture selectors. */
export function extractCourseFlag (args) {
  const rest = []
  let course = null

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '-c' || arg === '--course') {
      course = args[i + 1]
      if (course === undefined) throw new UserError(`${arg} needs a course selector`)
      i += 1
    } else if (arg.startsWith('--course=')) {
      course = arg.slice('--course='.length)
      if (course === '') throw new UserError('--course needs a course selector')
    } else {
      rest.push(arg)
    }
  }
  return { course, args: rest }
}

/** Pull a bare `--module` / `-m` switch out of the argument list. Unlike
    `--course` it takes no value: it selects which kind of thing `new` makes. */
export function extractModuleFlag (args) {
  const rest = args.filter((arg) => arg !== '--module' && arg !== '-m')
  return { isModule: rest.length !== args.length, args: rest }
}

/** Discover a course's lectures, failing loudly on a directory with no `slides.md`. */
async function loadLectures (course) {
  const lectures = await discoverLectures(course.lecturesDir)
  const broken = lectures.filter((lecture) => !lecture.hasSlides)
  if (broken.length > 0) {
    const names = broken.map((l) => l.id).join(', ')
    throw new UserError(`${course.id}: lecture directories without a slides.md: ${names}`)
  }
  return lectures
}

/**
 * Resolve the modules a course includes, in the order its `course.json` lists
 * them.
 *
 * Unlike `loadLectures`, a broken directory fails the build only when the
 * course actually includes it. `modules/` is shared: a half-written module
 * nobody has included yet must not break an unrelated course.
 */
async function loadModules (course, context) {
  if (course.moduleSelectors.length === 0) return []

  const available = await discoverModules(context.modulesDir)
  const chosen = course.moduleSelectors.map(
    (selector) => resolveSelector(available, selector, 'module')
  )

  const broken = chosen.filter((mod) => !mod.hasTutorial)
  if (broken.length > 0) {
    const names = broken.map((m) => m.id).join(', ')
    throw new UserError(
      `${course.id}: module directories without a tutorial.md: ${names}`
    )
  }
  return chosen
}

/** Every buildable thing in a course, in the order a student meets it. */
async function loadContent (course, context) {
  return [...await loadLectures(course), ...await loadModules(course, context)]
}

/**
 * Where an entry's artifacts land inside a course's `dist/`. Modules go under
 * `modules/` so that a module id and a lecture directory name cannot collide,
 * and so the layout matches how the index presents the two.
 */
function outDirFor (entry, course) {
  return entry.kind === 'module'
    ? path.join(course.distDir, 'modules', entry.id)
    : path.join(course.distDir, entry.id)
}

/** `dev` and `new` act on one lecture of one course, so the course has to be
    unambiguous — from the cwd, or from `-c`. */
function oneCourse (courses, command) {
  if (courses.length !== 1) {
    throw new UserError(
      `${command} needs exactly one course. Choose one with -c:\n` +
      formatEntryList(courses, 'course')
    )
  }
  return courses[0]
}

function warnFor (course, lecture) {
  return (message) => process.stderr.write(`  ! ${course.id}/${lecture.id}: ${message}\n`)
}

// --- commands ---------------------------------------------------------------

async function cmdList (courses) {
  for (const course of courses) {
    log(`${entryLabel(course)}  (${course.id})`)
    const lectures = await loadLectures(course)

    if (lectures.length === 0) {
      log('  No lectures yet. Create one with: npm run new -- 01 "Title"')
      continue
    }
    for (const lecture of lectures) {
      const artifacts = [
        lecture.abstractPath && 'abstract',
        lecture.notesPath && 'notes',
        lecture.labPath && 'lab',
        lecture.codeDir && 'code'
      ].filter(Boolean)
      const suffix = artifacts.length > 0 ? `  [${artifacts.join(', ')}]` : ''
      log(`  ${lecture.id.padEnd(28)} ${entryLabel(lecture)}${suffix}`)
    }
  }
}

async function cmdDev (course, selectors, context) {
  const entries = await loadContent(course, context)
  if (selectors.length !== 1) {
    throw new UserError(
      'dev needs exactly one selector. Available lectures and modules:\n' +
      formatEntryList(entries, 'content')
    )
  }
  const entry = resolveSelector(entries, selectors[0], 'content')
  if (!entry.hasSlides) {
    throw new UserError(
      `${course.id}/${entry.id} has no slides.md, so there is no deck to serve.\n` +
      `Render its prose instead with: npm run notes -- -c ${course.code ?? course.id} ${entry.id}`
    )
  }
  log(`dev: ${course.id}/${entry.id} — ${entryLabel(entry)}`)
  await run(context.slidev, [entry.slidesPath, '--open'], { cwd: context.workspaceRoot })
}

async function buildSlides (entry, course, context) {
  if (!entry.hasSlides) return
  const outDir = path.join(outDirFor(entry, course), 'slides')
  // `--out` resolves against the deck's own directory, so it must be absolute.
  // Hash routing plus a relative base lets the SPA work from whatever path the
  // LMS serves it at, without a rebuild.
  await run(context.slidev, [
    'build', entry.slidesPath,
    '--out', outDir,
    '--base', course.base,
    '--router-mode', 'hash'
  ], { cwd: context.workspaceRoot })
}

async function exportSlides (entry, course, context) {
  if (!entry.hasSlides) return
  const outPath = path.join(outDirFor(entry, course), 'slides.pdf')
  await mkdir(path.dirname(outPath), { recursive: true })
  await run(context.slidev, ['export', entry.slidesPath, '--output', outPath], {
    cwd: context.workspaceRoot
  })
}

/**
 * Render every prose document an entry has through the same pipeline.
 *
 * One ordered list serves both kinds. A lecture's `tutorialPath` is always null
 * and a prose-only module's `notesPath` and `labPath` usually are, so the
 * filter does all the work no branching on kind otherwise would.
 *
 * The abstract is HTML only — it is a course-page blurb, not a handout, and a
 * paragraph-length PDF has no audience and costs a browser launch.
 */
async function buildProse (entry, course) {
  const outDir = outDirFor(entry, course)
  const documents = [
    { source: entry.abstractPath, pdf: false },
    { source: entry.tutorialPath, pdf: true },
    { source: entry.notesPath, pdf: true },
    { source: entry.labPath, pdf: true }
  ].filter((doc) => doc.source)

  if (documents.length === 0) {
    process.stderr.write(
      `  ! ${course.id}/${entry.id}: no abstract.md, tutorial.md, notes.md, or lab.md\n`
    )
    return
  }
  for (const { source, pdf } of documents) {
    await buildDocument(source, outDir, {
      pdf,
      publicDir: entry.publicDir,
      warn: warnFor(course, entry)
    })
  }
}

async function copyCode (entry, course) {
  if (!entry.codeDir) return
  const entries = (await readdir(entry.codeDir)).filter((name) => !name.startsWith('.'))
  if (entries.length === 0) return
  await cp(entry.codeDir, path.join(outDirFor(entry, course), 'code'), {
    recursive: true,
    filter: (source) => !path.basename(source).startsWith('.')
  })
}

async function cmdBuild (course, selectors, context) {
  const lectures = await loadLectures(course)
  const modules = await loadModules(course, context)

  for (const entry of resolveSelectors([...lectures, ...modules], selectors, 'content')) {
    log(`\nbuild: ${course.id}/${entry.id} — ${entryLabel(entry)}`)
    // One deck at a time: every entry file is named slides.md, and Slidev's
    // multi-entry output paths derive from the entry basename, so they collide.
    await buildSlides(entry, course, context)
    await exportSlides(entry, course, context)
    await buildProse(entry, course)
    await copyCode(entry, course)
  }
  const indexPath = await writeIndex(lectures, modules, course)
  log(`\nwrote ${path.relative(context.workspaceRoot, indexPath)}`)
}

async function cmdExport (course, selectors, context) {
  for (const entry of resolveSelectors(await loadContent(course, context), selectors, 'content')) {
    if (!entry.hasSlides) continue
    log(`\nexport: ${course.id}/${entry.id}`)
    await exportSlides(entry, course, context)
  }
}

async function cmdNotes (course, selectors, context) {
  for (const entry of resolveSelectors(await loadContent(course, context), selectors, 'content')) {
    log(`\nnotes: ${course.id}/${entry.id}`)
    await buildProse(entry, course)
  }
}

function slugify (title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function cmdNew (course, args) {
  const [number, ...titleParts] = args
  const title = titleParts.join(' ').trim()

  if (!number || !title) {
    throw new UserError('Usage: npm run new -- <NN> "<Lecture Title>"')
  }
  if (!/^\d+$/.test(number)) {
    throw new UserError(`Lecture number must be digits, got "${number}"`)
  }

  const id = `${number.padStart(2, '0')}-${slugify(title)}`
  const dir = path.join(course.lecturesDir, id)

  if (existsSync(dir)) {
    throw new UserError(`${path.relative(course.dir, dir)} already exists; refusing to overwrite`)
  }
  if (!existsSync(LECTURE_TEMPLATE_DIR)) {
    throw new UserError(`Missing scaffold source at ${LECTURE_TEMPLATE_DIR}`)
  }

  await cp(LECTURE_TEMPLATE_DIR, dir, { recursive: true })

  // The template is shared by every course, so the course names itself here
  // rather than being written into the scaffold source.
  const substitutions = {
    '{{TITLE}}': title,
    '{{NUMBER}}': String(Number(number)),
    '{{COURSE}}': courseCodeLabel(course),
    '{{COURSE_TITLE}}': entryLabel(course)
  }
  for (const file of ['slides.md', 'abstract.md', 'notes.md']) {
    const filePath = path.join(dir, file)
    if (!existsSync(filePath)) continue
    let text = await readFile(filePath, 'utf8')
    for (const [token, value] of Object.entries(substitutions)) {
      text = text.replaceAll(token, () => value)
    }
    await writeFile(filePath, text, 'utf8')
  }

  log(`Created ${course.id}/lectures/${id}/`)
  log(`Start editing with: npm run dev -- -c ${course.code ?? course.id} ${number}`)
}

/**
 * Scaffold a shared module. It takes no course, and its slug is given
 * explicitly rather than derived from the title: the slug is the stable name
 * every including `course.json` references, so it must not churn when the
 * title is reworded.
 */
async function cmdNewModule (args, context) {
  const [slug, ...titleParts] = args
  const title = titleParts.join(' ').trim()

  if (!slug || !title) {
    throw new UserError('Usage: npm run new -- --module <slug> "<Module Title>"')
  }
  if (slug !== slugify(slug)) {
    throw new UserError(
      `Module slug must be lowercase words joined by hyphens, got "${slug}".\n` +
      `Did you mean "${slugify(slug)}"?`
    )
  }

  const dir = path.join(context.modulesDir, slug)
  if (existsSync(dir)) {
    throw new UserError(
      `${path.relative(context.workspaceRoot, dir)} already exists; refusing to overwrite`
    )
  }
  if (!existsSync(MODULE_TEMPLATE_DIR)) {
    throw new UserError(`Missing scaffold source at ${MODULE_TEMPLATE_DIR}`)
  }

  await cp(MODULE_TEMPLATE_DIR, dir, { recursive: true })

  for (const file of ['tutorial.md', 'abstract.md']) {
    const filePath = path.join(dir, file)
    if (!existsSync(filePath)) continue
    const text = await readFile(filePath, 'utf8')
    await writeFile(filePath, text.replaceAll('{{TITLE}}', () => title), 'utf8')
  }

  log(`Created ${MODULES_DIRNAME}/${slug}/`)
  log('')
  log('A module belongs to no course until one includes it. Add it to a')
  log('course.json to have it built:')
  log('')
  log(`  "modules": ["${slug}"]`)
}

// --- entry point ------------------------------------------------------------

/** Commands that act on one course at a time versus all the selected ones. */
const PER_COURSE = { build: cmdBuild, export: cmdExport, notes: cmdNotes }
const SINGLE_COURSE = { dev: cmdDev }

async function main (argv) {
  const [command, ...rest] = argv

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(USAGE)
    return
  }

  const { course: courseSelector, args } = extractCourseFlag(rest)

  const workspaceRoot = findWorkspaceRoot() ?? findWorkspaceRoot(process.cwd())
  if (!workspaceRoot) {
    throw new UserError(
      `Could not find ${path.join('node_modules', '.bin', 'slidev')} in any parent directory.\n` +
      'Run npm install at the workspace root first.'
    )
  }
  const context = {
    workspaceRoot,
    slidev: slidevBin(workspaceRoot),
    modulesDir: path.join(workspaceRoot, MODULES_DIRNAME)
  }
  const courses = await selectCourses(path.join(workspaceRoot, COURSES_DIRNAME), courseSelector)

  if (command === 'list') return cmdList(courses)

  if (command === 'new') {
    const { isModule, args: newArgs } = extractModuleFlag(args)
    if (isModule) return cmdNewModule(newArgs, context)
    return cmdNew(oneCourse(courses, 'new'), newArgs, context)
  }
  if (command in SINGLE_COURSE) {
    return SINGLE_COURSE[command](oneCourse(courses, command), args, context)
  }
  if (command in PER_COURSE) {
    for (const course of courses) await PER_COURSE[command](course, args, context)
    return
  }
  throw new UserError(`Unknown command "${command}".\n\n${USAGE}`)
}

/** CLI entry point: run `argv` and turn a failure into an exit code. */
export function cli (argv) {
  return main(argv).catch((error) => {
    process.stderr.write(`\n${isUserFacing(error) ? error.message : (error.stack ?? error.message)}\n`)
    process.exitCode = 1
  })
}
