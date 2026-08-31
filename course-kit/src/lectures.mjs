// Lecture discovery.
//
// A lecture is any directory under a course's `lectures/` holding a
// `slides.md`. There is no manifest: the directory listing is the source of
// truth and titles come from each deck's frontmatter.
//
// The selector machinery a lecture is named by lives in `content.mjs`, shared
// with modules and courses.

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { hasContent } from './content.mjs'

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
    kind: 'lecture',
    dir,
    number,
    slug,
    slidesPath,
    hasSlides: existsSync(slidesPath),
    title: null,
    notesPath: null,
    tutorialPath: null
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
