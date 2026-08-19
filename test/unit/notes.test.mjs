import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import { renderNotesHtml, buildDocument } from '../../scripts/notes.mjs'

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const SAMPLE = path.join(fixtures, 'notes', 'sample.md')
const PUBLIC = path.join(fixtures, 'notes', 'public')

/** Render the fixture once; every assertion below reads the same output. */
const rendered = await (async () => {
  const warnings = []
  const { html, title } = await renderNotesHtml(SAMPLE, {
    publicDir: PUBLIC,
    warn: (message) => warnings.push(message)
  })
  return { html, title, warnings }
})()

test('the frontmatter title becomes the document title and heading', () => {
  assert.equal(rendered.title, 'Sample Notes')
  assert.match(rendered.html, /<title>Sample Notes<\/title>/)
  assert.match(rendered.html, /<h1>Sample Notes<\/h1>/)
})

test('a frontmatter subtitle is rendered beneath the heading', () => {
  assert.match(rendered.html, /<p class="doc-subtitle">CSC 118 — Fixture<\/p>/)
})

test('frontmatter is not emitted into the body', () => {
  assert.doesNotMatch(rendered.html, /subtitle: CSC 118/)
})

test('the Markdown body is rendered', () => {
  assert.match(rendered.html, /<h2[^>]*>A heading/)
  assert.match(rendered.html, /<a href="https:\/\/example\.com">link<\/a>/)
})

test('headings get anchor ids', () => {
  assert.match(rendered.html, /<h2 id="a-heading"/)
})

test('CSS is inlined in a style element rather than linked', () => {
  assert.match(rendered.html, /<style>[\s\S]*\.doc-header[\s\S]*<\/style>/)
  assert.doesNotMatch(rendered.html, /<link[^>]+stylesheet/)
})

test('a root-relative image is embedded as a data URI', () => {
  assert.match(rendered.html, /src="data:image\/png;base64,[A-Za-z0-9+/=]+"/)
  assert.doesNotMatch(rendered.html, /src="\/diagram\.png"/)
})

test('an image missing from public/ is left as a link and reported', () => {
  assert.match(rendered.html, /src="\/nope\.png"/)
  assert.equal(rendered.warnings.length, 1)
  assert.match(rendered.warnings[0], /nope\.png/)
})

test('code blocks are highlighted by Shiki', () => {
  assert.match(rendered.html, /class="shiki/)
  assert.match(rendered.html, /<span style="color:/)
})

test('the output is a complete standalone document', () => {
  assert.match(rendered.html, /^<!DOCTYPE html>/)
  assert.match(rendered.html, /<\/html>\s*$/)
  assert.doesNotMatch(rendered.html, /\{\{\w+\}\}/)
})

test('a document without a frontmatter title falls back to its filename', async () => {
  const { title } = await renderNotesHtml(path.join(fixtures, 'lectures', 'notes-only', 'notes.md'))
  assert.equal(title, 'notes')
})

test('buildDocument with pdf: false writes HTML and skips the PDF', async (t) => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'csc118-notes-'))
  t.after(() => rm(outDir, { recursive: true, force: true }))

  const result = await buildDocument(SAMPLE, outDir, { publicDir: PUBLIC, pdf: false })

  assert.equal(result.pdfPath, null)
  assert.ok(result.htmlPath.endsWith('sample.html'))
  assert.ok((await stat(result.htmlPath)).size > 0)
  await assert.rejects(stat(path.join(outDir, 'sample.pdf')))
})
