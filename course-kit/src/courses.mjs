// Course discovery, and the roots a command resolves its paths against.
//
// A course is any directory under `courses/` holding a `course.json`. As with
// lectures there is no manifest: adding a course requires no registration
// anywhere, and the title is read from the file that marks the directory.
//
// Three roots replace the single repository root the tooling used when it
// served one course:
//
//   packageRoot    the kit's own assets and templates   (lectures.mjs)
//   courseRoot     course.json, lectures/, dist/        (cwd, or --course)
//   workspaceRoot  the Slidev binary, and courses/      (nearest ancestor
//                                                        holding it)

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { packageRoot, resolveSelector, SelectorError } from './lectures.mjs'

/** Where courses live, relative to the workspace root. */
export const COURSES_DIRNAME = 'courses'

const SLIDEV_BIN = path.join('node_modules', '.bin', 'slidev')

/** Walk up from `startDir`, inclusive, until `accept` recognises a directory. */
function findUp (startDir, accept) {
  let dir = path.resolve(startDir)
  for (;;) {
    if (accept(dir)) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * The workspace root: the nearest ancestor holding the Slidev binary. The kit
 * spawns Slidev rather than importing it, so where that binary lives is what
 * defines the workspace — and `courses/` sits beside it.
 *
 * The search starts from the kit itself, which npm links into the workspace's
 * `node_modules`, and falls back to the cwd for an installation that puts the
 * kit somewhere else.
 */
export function findWorkspaceRoot (startDir = packageRoot) {
  return findUp(startDir, (dir) => existsSync(path.join(dir, SLIDEV_BIN)))
}

/** The path to the Slidev binary for a given workspace root. */
export function slidevBin (workspaceRoot) {
  return path.join(workspaceRoot, SLIDEV_BIN)
}

/**
 * The course a directory sits inside, found the way git finds `.git`: walk up
 * looking for a `course.json`. Null when the invocation is above every course,
 * which is the workspace root and means "all of them".
 */
export function findCourseRoot (startDir = process.cwd()) {
  return findUp(startDir, (dir) => existsSync(path.join(dir, 'course.json')))
}

/**
 * Split `csc-118-intro-to-linux` into its course code and slug. A directory
 * name that does not parse keeps its whole name as the slug and carries no
 * code, so it can still be selected by id.
 */
export function parseCourseId (id) {
  const match = /^([a-z]+-\d+)-(.+)$/i.exec(id)
  if (!match) return { code: null, slug: id }
  return { code: match[1], slug: match[2] }
}

/** The course code as it is written in prose: `csc-118` becomes `CSC 118`. */
export function courseCodeLabel (course) {
  if (!course.code) return course.title ?? course.id
  return course.code.replace('-', ' ').toUpperCase()
}

/**
 * Read one course directory. Returns null when it holds no `course.json`,
 * which is how a stray directory under `courses/` is skipped rather than
 * reported — unlike a lecture, a course announces itself with a file.
 */
export async function readCourse (dir) {
  const configPath = path.join(dir, 'course.json')
  if (!existsSync(configPath)) return null

  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const id = path.basename(dir)
  const { code, slug } = parseCourseId(id)

  return {
    id,
    dir,
    code,
    slug,
    title: typeof config.title === 'string' ? config.title : null,
    base: typeof config.base === 'string' ? config.base : './',
    lecturesDir: path.join(dir, 'lectures'),
    distDir: path.join(dir, 'dist')
  }
}

/** Discover every course under `coursesDir`, sorted by directory name. */
export async function discoverCourses (coursesDir) {
  if (!existsSync(coursesDir)) return []

  const entries = await readdir(coursesDir, { withFileTypes: true })
  const dirs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(coursesDir, entry.name))

  const courses = await Promise.all(dirs.map((dir) => readCourse(dir)))
  return courses.filter(Boolean).sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Which courses a command runs against.
 *
 * `--course` wins wherever it is typed, so one course can be built from inside
 * another. Otherwise a cwd inside a course means that course, the way a git
 * command acts on the repository you are standing in. Above every course, a
 * bare invocation means all of them.
 */
export async function selectCourses (coursesDir, selector, cwd = process.cwd()) {
  if (selector) {
    return [resolveSelector(await discoverCourses(coursesDir), selector, 'course')]
  }

  const courseRoot = findCourseRoot(cwd)
  if (courseRoot) return [await readCourse(courseRoot)]

  const courses = await discoverCourses(coursesDir)
  if (courses.length === 0) {
    throw new SelectorError(
      `No course.json here, and no courses under ${coursesDir}.\n` +
      'Run from inside a course directory, or add one under courses/.'
    )
  }
  return courses
}
