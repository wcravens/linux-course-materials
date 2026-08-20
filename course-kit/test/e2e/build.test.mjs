// Slow: this runs the real build, which launches a headless browser twice.
// Kept out of `npm test` for that reason — run it with `npm run test:e2e`.

import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { stat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)

// The kit sits one level under the workspace root, beside `courses/`.
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const BIN = path.join(workspaceRoot, 'course-kit', 'bin', 'course.mjs')
const COURSE = path.join(workspaceRoot, 'courses', 'csc-118-intro-to-linux')
const LECTURE = '01-what-is-linux'
const DIST = path.join(COURSE, 'dist', LECTURE)

test('build produces every artifact for lecture 01', { timeout: 600_000 }, async (t) => {
  // Run from inside the course, which is also how the cwd walk-up finds it.
  await run('node', [BIN, 'build', '01'], { cwd: COURSE })

  for (const artifact of ['slides/index.html', 'slides.pdf', 'abstract.html', 'notes.html', 'notes.pdf']) {
    await t.test(`${artifact} exists and is non-empty`, async () => {
      const info = await stat(path.join(DIST, artifact))
      assert.ok(info.isFile(), `${artifact} should be a file`)
      assert.ok(info.size > 0, `${artifact} should be non-empty`)
    })
  }

  await t.test('the slide deck uses relative asset paths', async () => {
    const html = await readFile(path.join(DIST, 'slides', 'index.html'), 'utf8')
    assert.match(html, /src="\.\/assets\//)
    assert.doesNotMatch(html, /src="\/assets\//)
  })

  await t.test('notes.html is self-contained', async () => {
    const html = await readFile(path.join(DIST, 'notes.html'), 'utf8')
    assert.match(html, /<style>/)
    assert.doesNotMatch(html, /<link[^>]+stylesheet/)
  })

  await t.test('the course index links to the lecture', async () => {
    const html = await readFile(path.join(COURSE, 'dist', 'index.html'), 'utf8')
    assert.match(html, /CSC 118/)
    assert.match(html, new RegExp(`\\./${LECTURE}/slides/index\\.html`))
    assert.match(html, new RegExp(`\\./${LECTURE}/notes\\.pdf`))
  })

  await t.test('the abstract is HTML only', async () => {
    await assert.rejects(stat(path.join(DIST, 'abstract.pdf')))
  })

  await t.test('both PDFs are real PDFs', async () => {
    for (const pdf of ['slides.pdf', 'notes.pdf']) {
      const head = (await readFile(path.join(DIST, pdf))).subarray(0, 5).toString('latin1')
      assert.equal(head, '%PDF-', `${pdf} should start with a PDF header`)
    }
  })
})
