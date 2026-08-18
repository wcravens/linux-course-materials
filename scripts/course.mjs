#!/usr/bin/env node
// CSC 118 course build runner.
//
//   node scripts/course.mjs <command> [selector...]
//
// Selectors name a lecture by number (`01`), slug (`what-is-linux`), or full
// directory name. `build`, `export`, and `notes` operate on every lecture when
// given none.

import { spawn } from 'node:child_process'
import { readFile, writeFile, cp, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  repoRoot,
  discoverLectures,
  resolveSelector,
  resolveSelectors,
  lectureLabel,
  formatLectureList,
  SelectorError
} from './lectures.mjs'
import { buildDocument } from './notes.mjs'
import { writeIndex } from './index.mjs'

const LECTURES_DIR = path.join(repoRoot, 'lectures')
const DIST_DIR = path.join(repoRoot, 'dist')
const TEMPLATE_DIR = path.join(repoRoot, 'templates', 'lecture')
const SLIDEV_BIN = path.join(repoRoot, 'node_modules', '.bin', 'slidev')

const USAGE = `Usage: node scripts/course.mjs <command> [selector...]

Commands:
  dev <selector>        Start the Slidev dev server for one lecture
  build [selector...]   Build slides, PDFs, notes, and the course index
  export [selector...]  Export slide PDFs only
  notes [selector...]   Render notes and lab documents only
  new <NN> <title>      Scaffold a new lecture from templates/lecture/
  list                  List the lectures in this course

Selectors match a lecture by number, slug, or directory name:
  01    what-is-linux    01-what-is-linux
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
    const child = spawn(command, args, { stdio: 'inherit', cwd: repoRoot, ...options })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`${path.basename(command)} killed by ${signal}`))
      if (code !== 0) return reject(new Error(`${path.basename(command)} exited with code ${code}`))
      resolve()
    })
  })
}

async function readCourse () {
  const coursePath = path.join(repoRoot, 'course.json')
  if (!existsSync(coursePath)) return { title: 'Course', base: './' }
  return JSON.parse(await readFile(coursePath, 'utf8'))
}

/** Discover lectures, failing loudly on a directory that has no `slides.md`. */
async function loadLectures () {
  const lectures = await discoverLectures(LECTURES_DIR)
  const broken = lectures.filter((lecture) => !lecture.hasSlides)
  if (broken.length > 0) {
    const names = broken.map((l) => l.id).join(', ')
    throw new UserError(`Lecture directories without a slides.md: ${names}`)
  }
  return lectures
}

function warnFor (lecture) {
  return (message) => process.stderr.write(`  ! ${lecture.id}: ${message}\n`)
}

// --- commands ---------------------------------------------------------------

async function cmdList (lectures) {
  if (lectures.length === 0) {
    log('No lectures yet. Create one with: npm run new -- 01 "Title"')
    return
  }
  for (const lecture of lectures) {
    const artifacts = [
      lecture.notesPath && 'notes',
      lecture.labPath && 'lab',
      lecture.codeDir && 'code'
    ].filter(Boolean)
    const suffix = artifacts.length > 0 ? `  [${artifacts.join(', ')}]` : ''
    log(`${lecture.id.padEnd(28)} ${lectureLabel(lecture)}${suffix}`)
  }
}

async function cmdDev (lectures, selectors) {
  if (selectors.length !== 1) {
    throw new UserError(
      `dev needs exactly one lecture selector. Available lectures:\n${formatLectureList(lectures)}`
    )
  }
  const lecture = resolveSelector(lectures, selectors[0])
  log(`dev: ${lecture.id} — ${lectureLabel(lecture)}`)
  await run(SLIDEV_BIN, [lecture.slidesPath, '--open'])
}

async function buildSlides (lecture, course) {
  const outDir = path.join(DIST_DIR, lecture.id, 'slides')
  // `--out` resolves against the deck's own directory, so it must be absolute.
  // Hash routing plus a relative base lets the SPA work from whatever path the
  // LMS serves it at, without a rebuild.
  await run(SLIDEV_BIN, [
    'build', lecture.slidesPath,
    '--out', outDir,
    '--base', course.base ?? './',
    '--router-mode', 'hash'
  ])
}

async function exportSlides (lecture) {
  const outPath = path.join(DIST_DIR, lecture.id, 'slides.pdf')
  await mkdir(path.dirname(outPath), { recursive: true })
  await run(SLIDEV_BIN, ['export', lecture.slidesPath, '--output', outPath])
}

/** Render `notes.md` and, when present, `lab.md` through the same pipeline. */
async function buildProse (lecture) {
  const outDir = path.join(DIST_DIR, lecture.id)
  const sources = [lecture.notesPath, lecture.labPath].filter(Boolean)

  if (sources.length === 0) {
    process.stderr.write(`  ! ${lecture.id}: no notes.md or lab.md\n`)
    return
  }
  for (const source of sources) {
    await buildDocument(source, outDir, {
      publicDir: lecture.publicDir,
      warn: warnFor(lecture)
    })
  }
}

async function copyCode (lecture) {
  if (!lecture.codeDir) return
  const entries = (await readdir(lecture.codeDir)).filter((name) => !name.startsWith('.'))
  if (entries.length === 0) return
  await cp(lecture.codeDir, path.join(DIST_DIR, lecture.id, 'code'), {
    recursive: true,
    filter: (source) => !path.basename(source).startsWith('.')
  })
}

async function cmdBuild (lectures, selectors, course) {
  const targets = resolveSelectors(lectures, selectors)
  for (const lecture of targets) {
    log(`\nbuild: ${lecture.id} — ${lectureLabel(lecture)}`)
    // One deck at a time: every entry file is named slides.md, and Slidev's
    // multi-entry output paths derive from the entry basename, so they collide.
    await buildSlides(lecture, course)
    await exportSlides(lecture)
    await buildProse(lecture)
    await copyCode(lecture)
  }
  const indexPath = await writeIndex(lectures, course, DIST_DIR)
  log(`\nwrote ${path.relative(repoRoot, indexPath)}`)
}

async function cmdExport (lectures, selectors) {
  for (const lecture of resolveSelectors(lectures, selectors)) {
    log(`\nexport: ${lecture.id}`)
    await exportSlides(lecture)
  }
}

async function cmdNotes (lectures, selectors) {
  for (const lecture of resolveSelectors(lectures, selectors)) {
    log(`\nnotes: ${lecture.id}`)
    await buildProse(lecture)
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

async function cmdNew (args) {
  const [number, ...titleParts] = args
  const title = titleParts.join(' ').trim()

  if (!number || !title) {
    throw new UserError('Usage: npm run new -- <NN> "<Lecture Title>"')
  }
  if (!/^\d+$/.test(number)) {
    throw new UserError(`Lecture number must be digits, got "${number}"`)
  }

  const id = `${number.padStart(2, '0')}-${slugify(title)}`
  const dir = path.join(LECTURES_DIR, id)

  if (existsSync(dir)) {
    throw new UserError(`${path.relative(repoRoot, dir)} already exists; refusing to overwrite`)
  }
  if (!existsSync(TEMPLATE_DIR)) {
    throw new UserError(`Missing scaffold source at ${path.relative(repoRoot, TEMPLATE_DIR)}`)
  }

  await cp(TEMPLATE_DIR, dir, { recursive: true })

  const substitutions = { '{{TITLE}}': title, '{{NUMBER}}': String(Number(number)) }
  for (const file of ['slides.md', 'notes.md']) {
    const filePath = path.join(dir, file)
    if (!existsSync(filePath)) continue
    let text = await readFile(filePath, 'utf8')
    for (const [token, value] of Object.entries(substitutions)) {
      text = text.replaceAll(token, () => value)
    }
    await writeFile(filePath, text, 'utf8')
  }

  log(`Created lectures/${id}/`)
  log(`Start editing with: npm run dev -- ${number}`)
}

// --- entry point ------------------------------------------------------------

async function main (argv) {
  const [command, ...args] = argv

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(USAGE)
    return
  }

  if (command === 'new') return cmdNew(args)

  const course = await readCourse()
  const lectures = await loadLectures()

  switch (command) {
    case 'list': return cmdList(lectures)
    case 'dev': return cmdDev(lectures, args)
    case 'build': return cmdBuild(lectures, args, course)
    case 'export': return cmdExport(lectures, args)
    case 'notes': return cmdNotes(lectures, args)
    default:
      throw new UserError(`Unknown command "${command}".\n\n${USAGE}`)
  }
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`\n${isUserFacing(error) ? error.message : (error.stack ?? error.message)}\n`)
  process.exitCode = 1
})
