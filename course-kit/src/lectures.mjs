// Lecture discovery and selector resolution.
//
// A lecture is any directory under a course's `lectures/` holding a `slides.md`.
// There is no manifest: the directory listing is the source of truth and titles
// come from each deck's frontmatter.
//
// The selector machinery below is shared with course selectors (`courses.mjs`):
// both name a target by a handful of aliases, both want exact matching, and both
// want an error that lists the candidates. It takes a `kind` saying which is
// being resolved, so the only difference between the two is the aliases and the
// noun in the message.

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

/** A selector the user typed that could not be resolved. Reported without a
    stack trace, since the fault is in the argument, not the code. */
export class SelectorError extends Error {}

/**
 * The kit's own directory. It roots the files that travel with the tooling
 * rather than with any course — `assets/notes/` and `templates/lecture/` — and
 * so is resolved from this module's location, not from the cwd.
 */
export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Optional per-lecture artifacts, keyed by the file or directory they need. */
const OPTIONAL_FILES = { abstract: 'abstract.md', lab: 'lab.md' }
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
  const stripped = normalize(value).replace(/^0+/, '')
  return stripped === '' ? '0' : stripped
}

/** Strip hyphens so `csc118` and `csc-118` compare equal. */
function normalizeCode (value) {
  return normalize(value).replaceAll('-', '')
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
 * Discover every lecture in one course, sorted by numeric prefix (unnumbered
 * directories sort last, then alphabetically).
 */
export async function discoverLectures (lecturesDir) {
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

// --- selectors --------------------------------------------------------------

/**
 * What a selector may name, per kind, and how each alias is compared: a
 * lecture's number ignores leading zeros, a course's code ignores hyphens, and
 * everything else compares as written. An alias that is null — an unnumbered
 * lecture, a course directory whose name carries no code — simply never
 * matches.
 */
const KINDS = {
  lecture: {
    noun: 'lecture',
    plural: 'lectures',
    aliases: (lecture) => [
      [lecture.id, normalize],
      [lecture.slug, normalize],
      [lecture.number, normalizeNumber]
    ]
  },
  course: {
    noun: 'course',
    plural: 'courses',
    aliases: (course) => [
      [course.id, normalize],
      [course.slug, normalize],
      [course.code, normalizeCode]
    ]
  }
}

/** Human-readable label for a lecture or a course, falling back to its
    directory name when the source carries no title. */
export function entryLabel (entry) {
  return entry.title ?? `${entry.id} (untitled)`
}

/** A bulleted list of what was available, for error messages. */
export function formatEntryList (entries, kind = 'lecture') {
  if (entries.length === 0) return `  (no ${KINDS[kind].plural} found)`
  return entries.map((entry) => `  ${entry.id.padEnd(28)} ${entryLabel(entry)}`).join('\n')
}

/** True when `selector` names `entry` by one of its aliases — exactly. */
export function matchesSelector (entry, selector, kind = 'lecture') {
  return KINDS[kind].aliases(entry).some(
    ([value, compare]) => value != null && compare(selector) === compare(value)
  )
}

/**
 * Resolve one selector to exactly one entry. Throws on no match and on an
 * ambiguous match, naming the candidates either way.
 */
export function resolveSelector (entries, selector, kind = 'lecture') {
  const { noun, plural } = KINDS[kind]
  const matches = entries.filter((entry) => matchesSelector(entry, selector, kind))

  if (matches.length === 0) {
    throw new SelectorError(
      `No ${noun} matches "${selector}". Available ${plural}:\n${formatEntryList(entries, kind)}`
    )
  }
  if (matches.length > 1) {
    const names = matches.map((entry) => entry.id).join(', ')
    throw new SelectorError(`Selector "${selector}" is ambiguous; it matches: ${names}`)
  }
  return matches[0]
}

/**
 * Resolve a list of selectors. With none given, returns every entry — which
 * is what `build`, `export`, and `notes` do when invoked bare.
 */
export function resolveSelectors (entries, selectors, kind = 'lecture') {
  if (selectors.length === 0) return entries

  const chosen = []
  for (const selector of selectors) {
    const entry = resolveSelector(entries, selector, kind)
    if (!chosen.includes(entry)) chosen.push(entry)
  }
  return chosen
}
