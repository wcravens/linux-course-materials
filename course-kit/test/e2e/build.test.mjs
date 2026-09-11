// Slow: this runs the real build, which launches a headless browser twice.
// Kept out of `npm test` for that reason — run it with `npm run test:e2e`.

import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { stat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isTaggedPdf } from '../helpers/pdf.mjs'
import { contrastRatio } from '../../src/contrast.mjs'

const run = promisify(execFile)

// The kit sits one level under the workspace root, beside `courses/`.
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const BIN = path.join(workspaceRoot, 'course-kit', 'bin', 'course.mjs')
const COURSE = path.join(workspaceRoot, 'courses', 'csc-118-intro-to-linux')
const LECTURE = '01-what-is-linux'
const DIST = path.join(COURSE, 'dist', LECTURE)

// Slidev's `--slidev-code-background` in its light theme, which is what the
// exported PDF prints code on.
const SLIDE_CODE_BG = '#f5f5f5'
const AA = 4.5

test('build produces every artifact for lecture 01', { timeout: 600_000 }, async (t) => {
  // Run from inside the course, which is also how the cwd walk-up finds it.
  await run('node', [BIN, 'build', '01'], { cwd: COURSE })

  for (const artifact of ['slides/index.html', 'slides.pdf', 'notes.html', 'notes.pdf']) {
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

  await t.test('the abstract is the course\'s, not the lecture\'s', async () => {
    await assert.rejects(stat(path.join(DIST, 'abstract.html')))
    const info = await stat(path.join(COURSE, 'dist', 'abstract.html'))
    assert.ok(info.isFile() && info.size > 0)
  })

  await t.test('the course abstract is HTML only', async () => {
    await assert.rejects(stat(path.join(COURSE, 'dist', 'abstract.pdf')))
  })

  await t.test('the course index links the course abstract from its header', async () => {
    const html = await readFile(path.join(COURSE, 'dist', 'index.html'), 'utf8')
    assert.match(html, /<p class="course-abstract"><a href="\.\/abstract\.html">/)
  })

  await t.test('both PDFs are real PDFs', async () => {
    for (const pdf of ['slides.pdf', 'notes.pdf']) {
      const head = (await readFile(path.join(DIST, pdf))).subarray(0, 5).toString('latin1')
      assert.equal(head, '%PDF-', `${pdf} should start with a PDF header`)
    }
  })

  // An LMS accessibility checker rejects a PDF with no structure tree, so both
  // artifacts have to carry one — the deck by way of the `--import` shim, the
  // prose by asking Playwright directly.
  await t.test('both PDFs are tagged for accessibility', async () => {
    for (const pdf of ['slides.pdf', 'notes.pdf']) {
      assert.ok(await isTaggedPdf(path.join(DIST, pdf)),
        `${pdf} should carry an accessibility structure tree`)
    }
  })

  // The deck's code colors come from the addon's `setup/shiki.ts`, a hook Slidev
  // resolves from addon roots. Nothing in a build fails if that resolution ever
  // stops working — the decks would simply go back to shipping vitesse-light's
  // raw palette, whose comment gray is 2.1:1 here. So assert on the colors in
  // the built output.
  //
  // This lecture's only code block is fenced `text`, which Shiki does not
  // colorize, so there is often nothing here to check; that the hook loads and
  // does its job at all is covered by `test/unit/contrast.test.mjs`, which
  // imports the addon's export directly. What this adds is the end-to-end
  // reading: whatever colors a real build did emit, none of them fail.
  await t.test('every code color in the deck clears WCAG AA', async () => {
    const assets = path.join(DIST, 'slides', 'assets')
    const chunks = (await readdir(assets)).filter((f) => f.endsWith('.js'))

    const colors = new Set()
    for (const chunk of chunks) {
      const js = await readFile(path.join(assets, chunk), 'utf8')
      // Shiki writes a light/dark pair as custom properties. Only the light one
      // is printed; the dark is drawn on a background this check knows nothing
      // about. The key is matched exactly so `--shiki-light-bg` is left out.
      for (const [, color] of js.matchAll(/"--shiki-light":\s*[`'"](#[0-9a-f]{3,8})[`'"]/gi)) {
        colors.add(color)
      }
    }

    for (const color of colors) {
      const ratio = contrastRatio(color, SLIDE_CODE_BG)
      assert.ok(ratio >= AA, `${color} on ${SLIDE_CODE_BG} is ${ratio?.toFixed(2)}:1, below AA`)
    }
  })
})
