// The selector machinery every kind of content shares, and the kit's own root.
//
// Lectures, modules, and courses are all named the same way: by a handful of
// aliases, matched exactly, with an error that lists the candidates when the
// answer is not unique. That logic lived in `lectures.mjs` and was imported
// from `courses.mjs`, a dependency pointing the wrong way. It lives here now,
// and each content module depends on this one rather than on a sibling.
//
// A descriptor carries its own `kind`, which is what lets one list hold
// lectures and modules at once: the aliases come from the entry, and the `kind`
// argument below only chooses the noun an error message uses.

import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** A selector the user typed that could not be resolved. Reported without a
    stack trace, since the fault is in the argument, not the code. */
export class SelectorError extends Error {}

/**
 * The kit's own directory. It roots the files that travel with the tooling
 * rather than with any course — `assets/notes/` and `templates/` — and so is
 * resolved from this module's location, not from the cwd.
 */
export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
export async function hasContent (dir) {
  if (!existsSync(dir)) return false
  const entries = await readdir(dir)
  return entries.some((name) => !name.startsWith('.'))
}

/**
 * What a selector may name, per kind, and how each alias is compared: a
 * lecture's number ignores leading zeros, a course's code ignores hyphens, and
 * everything else compares as written. An alias that is null — an unnumbered
 * lecture, a course directory whose name carries no code — simply never
 * matches.
 *
 * `content` is a message-only kind, used when a list holds both lectures and
 * modules. It needs no aliases: every entry brings its own.
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
  module: {
    noun: 'module',
    plural: 'modules',
    aliases: (mod) => [
      [mod.id, normalize],
      [mod.slug, normalize]
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
  },
  content: {
    noun: 'lecture or module',
    plural: 'lectures and modules'
  }
}

/** Human-readable label for any content entry, falling back to its directory
    name when the source carries no title. */
export function entryLabel (entry) {
  return entry.title ?? `${entry.id} (untitled)`
}

/** A bulleted list of what was available, for error messages. A list holding
    more than one kind tags the modules, so the two are told apart. */
export function formatEntryList (entries, kind = 'lecture') {
  if (entries.length === 0) return `  (no ${KINDS[kind].plural} found)`

  const mixed = new Set(entries.map((entry) => entry.kind)).size > 1
  return entries.map((entry) => {
    const tag = mixed && entry.kind === 'module' ? '  [module]' : ''
    return `  ${entry.id.padEnd(28)} ${entryLabel(entry)}${tag}`
  }).join('\n')
}

/** True when `selector` names `entry` by one of its aliases — exactly. The
    aliases come from the entry's own kind, so a mixed list resolves correctly. */
export function matchesSelector (entry, selector, kind = 'lecture') {
  const { aliases } = KINDS[entry.kind ?? kind]
  if (!aliases) return false
  return aliases(entry).some(
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
