// Lecture discovery and selector resolution.
//
// A lecture is any directory under `lectures/` holding a `slides.md`. There is
// no manifest: the directory listing is the source of truth and titles come
// from each deck's frontmatter.

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

/** A selector the user typed that could not be resolved. Reported without a
    stack trace, since the fault is in the argument, not the code. */
export class SelectorError extends Error {}

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Optional per-lecture artifacts, keyed by the file or directory they need. */
const OPTIONAL_FILES = { lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }

/**
 * Split `01-what-is-linux` into its numeric prefix and slug remainder.
 * A directory without a numeric prefix keeps its whole name as the slug.
 */
export function parseLectureId (id) {
  const match = /^(\d+)-(.+)$/.exec(id)
  if (!match) return { number: null, slug: id }
  return { number: match[1], slug: match[2] }
}

/** Lowercase and strip surrounding slashes so `01/` and `01` compare equal. */
function normalize (value) {
  return String(value).trim().replace(/^\/+|\/+$/g, '').toLowerCase()
}

/** Strip leading zeros so `1` and `01` compare equal, but `0` stays `0`. */
function normalizeNumber (value) {
  const stripped = String(value).replace(/^0+/, '')
  return stripped === '' ? '0' : stripped
}

/**
 * True when `dir` exists and holds something other than placeholder dotfiles.
 * A scaffolded `code/.gitkeep` should not read as "this lecture has code".
 */
async function hasContent (dir) {
  if (!existsSync(dir)) return false
  const entries = await readdir(dir)
  return entries.some((name) => !name.startsWith('.'))
}

/**
 * Read one lecture directory. Returns a descriptor even when `slides.md` is
 * missing, flagged by `hasSlides`, so callers can report the problem rather
 * than silently skipping the directory.
 */
export async function readLecture (lecturesDir, id) {
  const dir = path.join(lecturesDir, id)
  const slidesPath = path.join(dir, 'slides.md')
  const { number, slug } = parseLectureId(id)

  const lecture = {
    id,
    dir,
    number,
    slug,
    slidesPath,
    hasSlides: existsSync(slidesPath),
    title: null,
    notesPath: null
  }

  if (lecture.hasSlides) {
    const { data } = matter(await readFile(slidesPath, 'utf8'))
    lecture.title = typeof data.title === 'string' ? data.title : null
  }

  const notesPath = path.join(dir, 'notes.md')
  if (existsSync(notesPath)) lecture.notesPath = notesPath

  for (const [key, file] of Object.entries(OPTIONAL_FILES)) {
    const candidate = path.join(dir, file)
    lecture[`${key}Path`] = existsSync(candidate) ? candidate : null
  }
  for (const [key, dirName] of Object.entries(OPTIONAL_DIRS)) {
    const candidate = path.join(dir, dirName)
    lecture[`${key}Dir`] = await hasContent(candidate) ? candidate : null
  }

  return lecture
}

/**
 * Discover every lecture, sorted by numeric prefix (unnumbered directories
 * sort last, then alphabetically).
 */
export async function discoverLectures (lecturesDir = path.join(repoRoot, 'lectures')) {
  if (!existsSync(lecturesDir)) return []

  const entries = await readdir(lecturesDir, { withFileTypes: true })
  const ids = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)

  const lectures = await Promise.all(ids.map((id) => readLecture(lecturesDir, id)))

  return lectures.sort((a, b) => {
    if (a.number !== null && b.number !== null) {
      const diff = Number(a.number) - Number(b.number)
      if (diff !== 0) return diff
    } else if (a.number !== null) {
      return -1
    } else if (b.number !== null) {
      return 1
    }
    return a.id.localeCompare(b.id)
  })
}

/** Human-readable label, falling back to the directory name when untitled. */
export function lectureLabel (lecture) {
  return lecture.title ?? `${lecture.id} (untitled)`
}

/** A bulleted list of available lectures, for error messages. */
export function formatLectureList (lectures) {
  if (lectures.length === 0) return '  (no lectures found)'
  return lectures.map((l) => `  ${l.id.padEnd(28)} ${lectureLabel(l)}`).join('\n')
}

/** True when `selector` names `lecture` by id, number, or slug — exactly. */
export function matchesSelector (lecture, selector) {
  const wanted = normalize(selector)
  if (wanted === normalize(lecture.id)) return true
  if (wanted === normalize(lecture.slug)) return true
  if (lecture.number !== null && normalizeNumber(wanted) === normalizeNumber(lecture.number)) {
    return true
  }
  return false
}

/**
 * Resolve one selector to exactly one lecture. Throws on no match and on an
 * ambiguous match, naming the candidates either way.
 */
export function resolveSelector (lectures, selector) {
  const matches = lectures.filter((lecture) => matchesSelector(lecture, selector))

  if (matches.length === 0) {
    throw new SelectorError(
      `No lecture matches "${selector}". Available lectures:\n${formatLectureList(lectures)}`
    )
  }
  if (matches.length > 1) {
    const names = matches.map((l) => l.id).join(', ')
    throw new SelectorError(`Selector "${selector}" is ambiguous; it matches: ${names}`)
  }
  return matches[0]
}

/**
 * Resolve a list of selectors. With none given, returns every lecture — which
 * is what `build`, `export`, and `notes` do when invoked bare.
 */
export function resolveSelectors (lectures, selectors) {
  if (selectors.length === 0) return lectures

  const chosen = []
  for (const selector of selectors) {
    const lecture = resolveSelector(lectures, selector)
    if (!chosen.includes(lecture)) chosen.push(lecture)
  }
  return chosen
}
