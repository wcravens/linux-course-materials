import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  packageRoot,
  matchesSelector,
  resolveSelector,
  resolveSelectors,
  formatEntryList
} from '../../src/content.mjs'
import { discoverLectures } from '../../src/lectures.mjs'

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const LECTURES = path.join(fixtures, 'lectures')

/** A module descriptor built by hand, so this file does not depend on Task 2. */
const mod = (id, title) => ({ kind: 'module', id, slug: id, number: null, title })

test('packageRoot points at the kit, which owns the shared assets', () => {
  assert.equal(path.basename(packageRoot), 'course-kit')
})

test('a descriptor picks its aliases from its own kind, not the argument', () => {
  const markdown = mod('markdown', 'Writing Markdown')

  // No `kind` argument at all: entry.kind decides.
  assert.equal(matchesSelector(markdown, 'markdown'), true)
  assert.equal(matchesSelector(markdown, 'MARKDOWN'), true)
  assert.equal(matchesSelector(markdown, 'markdown/'), true)
})

test('module matching is exact, not substring', () => {
  const markdown = mod('markdown', 'Writing Markdown')
  assert.equal(matchesSelector(markdown, 'mark'), false)
  assert.equal(matchesSelector(markdown, 'down'), false)
})

test('a module has no number, so a numeric selector never matches it', () => {
  assert.equal(matchesSelector(mod('markdown', 'Writing Markdown'), '01'), false)
})

test('selectors resolve over a mixed list of lectures and modules', async () => {
  const entries = [...await discoverLectures(LECTURES), mod('markdown', 'Writing Markdown')]

  assert.equal(resolveSelector(entries, '01', 'content').id, '01-intro')
  assert.equal(resolveSelector(entries, 'markdown', 'content').id, 'markdown')
  assert.equal(resolveSelector(entries, 'shell-basics', 'content').id, '02-shell-basics')
})

test('an unknown selector over a mixed list names both kinds', async () => {
  const entries = [...await discoverLectures(LECTURES), mod('markdown', 'Writing Markdown')]
  assert.throws(
    () => resolveSelector(entries, 'nope', 'content'),
    (error) => {
      assert.match(error.message, /No lecture or module matches "nope"/)
      assert.match(error.message, /Available lectures and modules/)
      assert.match(error.message, /markdown/)
      assert.match(error.message, /01-intro/)
      return true
    }
  )
})

test('a module slug colliding with a lecture slug is an ambiguity error', async () => {
  const entries = [...await discoverLectures(LECTURES), mod('shell-basics', 'Shell Basics Module')]
  assert.throws(
    () => resolveSelector(entries, 'shell-basics', 'content'),
    (error) => {
      assert.match(error.message, /ambiguous/)
      assert.match(error.message, /02-shell-basics, shell-basics/)
      return true
    }
  )
})

test('a mixed listing tags which entries are modules', async () => {
  const entries = [...await discoverLectures(LECTURES), mod('markdown', 'Writing Markdown')]
  const listing = formatEntryList(entries, 'content')

  assert.match(listing, /markdown\s+Writing Markdown\s+\[module\]/)
  assert.doesNotMatch(listing, /01-intro.*\[module\]/)
})

test('a single-kind listing carries no tags', async () => {
  const listing = formatEntryList(await discoverLectures(LECTURES))
  assert.doesNotMatch(listing, /\[module\]/)
})

test('an empty list names the kind that was expected', () => {
  assert.match(formatEntryList([], 'module'), /\(no modules found\)/)
  assert.match(formatEntryList([], 'content'), /\(no lectures and modules found\)/)
})

test('no selectors means every entry', async () => {
  const entries = [...await discoverLectures(LECTURES), mod('markdown', 'Writing Markdown')]
  assert.equal(resolveSelectors(entries, [], 'content').length, entries.length)
})

test('repeated selectors resolve to one entry each', async () => {
  const entries = [...await discoverLectures(LECTURES), mod('markdown', 'Writing Markdown')]
  assert.deepEqual(
    resolveSelectors(entries, ['01', '1', 'markdown'], 'content').map((e) => e.id),
    ['01-intro', 'markdown']
  )
})

const AMBIGUOUS = path.join(fixtures, 'ambiguous')

test('a lecture selector resolves by number, slug, or full directory name', async () => {
  const lectures = await discoverLectures(LECTURES)
  for (const selector of ['02', '2', 'shell-basics', '02-shell-basics']) {
    assert.equal(resolveSelector(lectures, selector).id, '02-shell-basics', selector)
  }
})

test('lecture matching is case-insensitive and tolerates a trailing slash', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.equal(resolveSelector(lectures, 'Shell-Basics').id, '02-shell-basics')
  assert.equal(resolveSelector(lectures, '02-shell-basics/').id, '02-shell-basics')
})

test('lecture matching is exact, not substring', async () => {
  const lectures = await discoverLectures(LECTURES)
  const shell = lectures.find((l) => l.id === '02-shell-basics')

  assert.equal(matchesSelector(shell, 'shell'), false)
  assert.equal(matchesSelector(shell, 'basics'), false)
  assert.equal(matchesSelector(shell, '0'), false)
})

test('an unknown lecture selector errors and lists the available lectures', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.throws(
    () => resolveSelector(lectures, '99'),
    (error) => {
      assert.match(error.message, /No lecture matches "99"/)
      assert.match(error.message, /01-intro/)
      assert.match(error.message, /10-networking/)
      return true
    }
  )
})

test('an ambiguous lecture selector errors naming the candidates', async () => {
  const lectures = await discoverLectures(AMBIGUOUS)
  assert.throws(
    () => resolveSelector(lectures, 'shell'),
    (error) => {
      assert.match(error.message, /ambiguous/)
      assert.match(error.message, /01-shell, 02-shell/)
      return true
    }
  )
})
