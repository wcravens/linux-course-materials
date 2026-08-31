// Module discovery.
//
// A module is a directory of material on one topic — a Markdown tutorial, a
// walkthrough for building a VM — that belongs to no single course. Modules
// live at the workspace level, beside `courses/`, and any number of courses
// include one by name.
//
// As with lectures and courses there is no manifest: `tutorial.md` marks the
// directory and its frontmatter supplies the title. Modules are prose-first, so
// unlike a lecture a module needs no deck; `slides.md` is one more optional
// artifact.
//
// Modules are unnumbered. A module is a topic rather than a position in a
// sequence, so discovery sorts by name and a course's own ordering comes from
// the list in its `course.json`.

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { hasContent } from './content.mjs'

/** Where modules live, relative to the workspace root. */
export const MODULES_DIRNAME = 'modules'

/** Optional per-module artifacts, keyed by the file or directory they need. */
const OPTIONAL_FILES = { abstract: 'abstract.md', notes: 'notes.md', lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }

/**
 * Read one module directory. Returns a descriptor even when `tutorial.md` is
 * missing, flagged by `hasTutorial`, so callers can report the problem rather
 * than silently skipping the directory — the same contract `readLecture()`
 * keeps for `slides.md`.
 */
export async function readModule (modulesDir, id) {
  const dir = path.join(modulesDir, id)
  const tutorialPath = path.join(dir, 'tutorial.md')
  const slidesPath = path.join(dir, 'slides.md')
  const hasTutorial = existsSync(tutorialPath)

  const mod = {
    id,
    kind: 'module',
    dir,
    // A module is a topic, not a position: it is never numbered, and its slug
    // is therefore always its id. Both are kept so a mixed list of lectures and
    // modules has one uniform shape.
    number: null,
    slug: id,
    tutorialPath: hasTutorial ? tutorialPath : null,
    hasTutorial,
    slidesPath,
    hasSlides: existsSync(slidesPath),
    title: null
  }

  if (hasTutorial) {
    const { data } = matter(await readFile(tutorialPath, 'utf8'))
    mod.title = typeof data.title === 'string' ? data.title : null
  }

  for (const [key, file] of Object.entries(OPTIONAL_FILES)) {
    const candidate = path.join(dir, file)
    mod[`${key}Path`] = existsSync(candidate) ? candidate : null
  }
  for (const [key, dirName] of Object.entries(OPTIONAL_DIRS)) {
    const candidate = path.join(dir, dirName)
    mod[`${key}Dir`] = await hasContent(candidate) ? candidate : null
  }

  return mod
}

/** Discover every module under `modulesDir`, sorted by directory name. */
export async function discoverModules (modulesDir) {
  if (!existsSync(modulesDir)) return []

  const entries = await readdir(modulesDir, { withFileTypes: true })
  const ids = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)

  const modules = await Promise.all(ids.map((id) => readModule(modulesDir, id)))
  return modules.sort((a, b) => a.id.localeCompare(b.id))
}
