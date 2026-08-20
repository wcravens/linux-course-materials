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
  discoverLectures,
  resolveSelector,
  resolveSelectors,
  entryLabel,
  formatEntryList,
  SelectorError
} from './lectures.mjs'
import {
  COURSES_DIRNAME,
  courseCodeLabel,
  findWorkspaceRoot,
  selectCourses,
  slidevBin
} from './courses.mjs'
import { buildDocument } from './notes.mjs'
import { writeIndex } from './index.mjs'

const TEMPLATE_DIR = path.join(packageRoot, 'templates', 'lecture')

const USAGE = `Usage: course <command> [-c <course>] [selector...]

Commands:
  dev <selector>        Start the Slidev dev server for one lecture
  build [selector...]   Build slides, PDFs, prose documents, and the course index
  export [selector...]  Export slide PDFs only
  notes [selector...]   Render abstracts, notes, and lab documents only
  new <NN> <title>      Scaffold a new lecture from the kit's template
  list                  List courses and their lectures

Lecture selectors match by number, slug, or directory name:
  01    what-is-linux    01-what-is-linux

-c, --course <selector> matches by code, slug, or directory name:
  csc-118    csc118    intro-to-linux    csc-118-intro-to-linux

Run from inside a course directory and that course is implied. Above one,
build, export, notes, and list cover every course; dev and new need -c.
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
  const lectures = await loadLectures(course)
  if (selectors.length !== 1) {
    throw new UserError(
      `dev needs exactly one lecture selector. Available lectures:\n${formatEntryList(lectures)}`
    )
  }
  const lecture = resolveSelector(lectures, selectors[0])
  log(`dev: ${course.id}/${lecture.id} — ${entryLabel(lecture)}`)
  await run(context.slidev, [lecture.slidesPath, '--open'], { cwd: context.workspaceRoot })
}

async function buildSlides (lecture, course, context) {
  const outDir = path.join(course.distDir, lecture.id, 'slides')
  // `--out` resolves against the deck's own directory, so it must be absolute.
  // Hash routing plus a relative base lets the SPA work from whatever path the
  // LMS serves it at, without a rebuild.
  await run(context.slidev, [
    'build', lecture.slidesPath,
    '--out', outDir,
    '--base', course.base,
    '--router-mode', 'hash'
  ], { cwd: context.workspaceRoot })
}

async function exportSlides (lecture, course, context) {
  const outPath = path.join(course.distDir, lecture.id, 'slides.pdf')
  await mkdir(path.dirname(outPath), { recursive: true })
  await run(context.slidev, ['export', lecture.slidesPath, '--output', outPath], {
    cwd: context.workspaceRoot
  })
}

/**
 * Render every prose document a lecture has through the same pipeline.
 * The abstract is HTML only — it is an LMS module blurb, not a handout.
 */
async function buildProse (lecture, course) {
  const outDir = path.join(course.distDir, lecture.id)
  const documents = [
    { source: lecture.abstractPath, pdf: false },
    { source: lecture.notesPath, pdf: true },
    { source: lecture.labPath, pdf: true }
  ].filter((doc) => doc.source)

  if (documents.length === 0) {
    process.stderr.write(`  ! ${course.id}/${lecture.id}: no abstract.md, notes.md, or lab.md\n`)
    return
  }
  for (const { source, pdf } of documents) {
    await buildDocument(source, outDir, {
      pdf,
      publicDir: lecture.publicDir,
      warn: warnFor(course, lecture)
    })
  }
}

async function copyCode (lecture, course) {
  if (!lecture.codeDir) return
  const entries = (await readdir(lecture.codeDir)).filter((name) => !name.startsWith('.'))
  if (entries.length === 0) return
  await cp(lecture.codeDir, path.join(course.distDir, lecture.id, 'code'), {
    recursive: true,
    filter: (source) => !path.basename(source).startsWith('.')
  })
}

async function cmdBuild (course, selectors, context) {
  const lectures = await loadLectures(course)
  for (const lecture of resolveSelectors(lectures, selectors)) {
    log(`\nbuild: ${course.id}/${lecture.id} — ${entryLabel(lecture)}`)
    // One deck at a time: every entry file is named slides.md, and Slidev's
    // multi-entry output paths derive from the entry basename, so they collide.
    await buildSlides(lecture, course, context)
    await exportSlides(lecture, course, context)
    await buildProse(lecture, course)
    await copyCode(lecture, course)
  }
  const indexPath = await writeIndex(lectures, course)
  log(`\nwrote ${path.relative(context.workspaceRoot, indexPath)}`)
}

async function cmdExport (course, selectors, context) {
  const lectures = await loadLectures(course)
  for (const lecture of resolveSelectors(lectures, selectors)) {
    log(`\nexport: ${course.id}/${lecture.id}`)
    await exportSlides(lecture, course, context)
  }
}

async function cmdNotes (course, selectors) {
  const lectures = await loadLectures(course)
  for (const lecture of resolveSelectors(lectures, selectors)) {
    log(`\nnotes: ${course.id}/${lecture.id}`)
    await buildProse(lecture, course)
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
  if (!existsSync(TEMPLATE_DIR)) {
    throw new UserError(`Missing scaffold source at ${TEMPLATE_DIR}`)
  }

  await cp(TEMPLATE_DIR, dir, { recursive: true })

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

// --- entry point ------------------------------------------------------------

/** Commands that act on one course at a time versus all the selected ones. */
const PER_COURSE = { build: cmdBuild, export: cmdExport, notes: cmdNotes }
const SINGLE_COURSE = { dev: cmdDev, new: cmdNew }

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
  const context = { workspaceRoot, slidev: slidevBin(workspaceRoot) }
  const courses = await selectCourses(path.join(workspaceRoot, COURSES_DIRNAME), courseSelector)

  if (command === 'list') return cmdList(courses)

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
