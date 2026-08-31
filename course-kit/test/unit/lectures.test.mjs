import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { discoverLectures, parseLectureId } from '../../src/lectures.mjs'

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const LECTURES = path.join(fixtures, 'lectures')

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
  assert.equal(intro.labPath, null)
  assert.equal(intro.codeDir, null)
  assert.ok(orphan.notesPath?.endsWith('notes.md'))
})

test('a lecture does not pick up an abstract, even holding one', async () => {
  // notes-only/ still contains an abstract.md. An abstract describes the
  // course as a whole, so a lecture must not claim one: the file on disk is
  // what makes this assertion mean something.
  const lectures = await discoverLectures(LECTURES)
  const orphan = lectures.find((l) => l.id === 'notes-only')

  assert.ok(existsSync(path.join(orphan.dir, 'abstract.md')))
  assert.ok(!('abstractPath' in orphan))
})

test('a lecture descriptor declares its kind', async () => {
  const lectures = await discoverLectures(LECTURES)
  assert.ok(lectures.every((l) => l.kind === 'lecture'))
})
