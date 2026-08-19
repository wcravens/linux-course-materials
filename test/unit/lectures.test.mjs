import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  discoverLectures,
  resolveSelector,
  resolveSelectors,
  parseLectureId,
  matchesSelector
} from '../../scripts/lectures.mjs'

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const LECTURES = path.join(fixtures, 'lectures')
const AMBIGUOUS = path.join(fixtures, 'ambiguous')

test('parseLectureId splits a numeric prefix from its slug', () => {
  assert.deepEqual(parseLectureId('01-what-is-linux'), { number: '01', slug: 'what-is-linux' })
  assert.deepEqual(parseLectureId('10-networking'), { number: '10', slug: 'networking' })
})

test('parseLectureId keeps an unnumbered name whole', () => {
  assert.deepEqual(parseLectureId('appendix'), { number: null, slug: 'appendix' })
})

test('discovery finds lecture directories sorted by numeric prefix', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.deepEqual(
    lectures.map((l) => l.id),
    ['01-intro', '02-shell-basics', '10-networking', 'notes-only']
  )
})

test('discovery reads titles from slides.md frontmatter', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.deepEqual(
    lectures.filter((l) => l.hasSlides).map((l) => l.title),
    ['Intro', 'Shell Basics', 'Networking']
  )
})

test('a directory without slides.md is reported, not silently skipped', async () => {
  const lectures = await discoverLectures(LECTURES)
  const orphan = lectures.find((l) => l.id === 'notes-only')

  assert.ok(orphan, 'the directory should still appear in the discovered list')
  assert.equal(orphan.hasSlides, false)
  assert.equal(orphan.title, null)
})

test('discovery returns an empty list for a missing lectures directory', async () => {
  assert.deepEqual(await discoverLectures(path.join(fixtures, 'does-not-exist')), [])
})

test('optional artifacts are detected per lecture', async () => {
  const lectures = await discoverLectures(LECTURES)
  const intro = lectures.find((l) => l.id === '01-intro')
  const orphan = lectures.find((l) => l.id === 'notes-only')

  assert.equal(intro.notesPath, null)
  assert.equal(intro.abstractPath, null)
  assert.equal(intro.labPath, null)
  assert.equal(intro.codeDir, null)
  assert.ok(orphan.notesPath?.endsWith('notes.md'))
  assert.ok(orphan.abstractPath?.endsWith('abstract.md'))
})

test('a selector resolves by number, slug, or full directory name', async () => {
  const lectures = await discoverLectures(LECTURES)
  for (const selector of ['02', '2', 'shell-basics', '02-shell-basics']) {
    assert.equal(resolveSelector(lectures, selector).id, '02-shell-basics', selector)
  }
})

test('selector matching is case-insensitive and tolerates a trailing slash', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.equal(resolveSelector(lectures, 'Shell-Basics').id, '02-shell-basics')
  assert.equal(resolveSelector(lectures, '02-shell-basics/').id, '02-shell-basics')
})

test('selector matching is exact, not substring', async () => {
  const lectures = await discoverLectures(LECTURES)
  const shell = lectures.find((l) => l.id === '02-shell-basics')

  assert.equal(matchesSelector(shell, 'shell'), false)
  assert.equal(matchesSelector(shell, 'basics'), false)
  assert.equal(matchesSelector(shell, '0'), false)
})

test('an unknown selector errors and lists the available lectures', async () => {
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

test('an ambiguous selector errors naming the candidates', async () => {
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

test('no selectors means every lecture', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.equal(resolveSelectors(lectures, []).length, lectures.length)
})

test('repeated selectors resolve to one lecture each', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.deepEqual(
    resolveSelectors(lectures, ['01', '1', '10-networking']).map((l) => l.id),
    ['01-intro', '10-networking']
  )
})
