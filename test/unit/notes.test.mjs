import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import { renderNotesHtml, buildDocument, contrastRatio, readableColor } from '../../scripts/notes.mjs'

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

test('headings carry no visible permalink link', () => {
  assert.doesNotMatch(rendered.html, /header-anchor/)
  assert.match(rendered.html, /<h2 id="a-heading"[^>]*>A heading<\/h2>/)
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

test('table header cells declare a column scope', () => {
  assert.match(rendered.html, /<th scope="col">Column<\/th>/)
  // The alignment style markdown-it emits survives alongside the new attribute.
  assert.match(rendered.html, /<th style="text-align:right" scope="col">Count<\/th>/)
  assert.doesNotMatch(rendered.html, /<td[^>]*scope=/)
})

/** WCAG AA for body-size text; code in these documents is well under 18pt. */
const AA = 4.5

/** Every inline `color:` Shiki wrote, ignoring the unused --shiki-dark ones. */
function lightThemeColors (html) {
  const colors = []
  for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
    for (const declaration of style.split(';')) {
      const [property, value = ''] = declaration.split(':')
      if (property.trim() === 'color') colors.push(value.trim())
    }
  }
  return colors
}

test('contrastRatio matches the WCAG reference values', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21)
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1)
  // vitesse-light's comment gray, the color that started this.
  assert.ok(Math.abs(contrastRatio('#A0ADA0', '#f5f4ef') - 2.12) < 0.01)
  // A translucent foreground is composited onto the background first.
  assert.ok(contrastRatio('#00000077', '#ffffff') < contrastRatio('#000000', '#ffffff'))
  assert.equal(contrastRatio('currentColor', '#ffffff'), null)
})

test('readableColor darkens only what fails, and leaves non-colors alone', () => {
  assert.equal(readableColor('#393a34', '#f5f4ef'), '#393a34')
  const fixed = readableColor('#A0ADA0', '#f5f4ef')
  assert.notEqual(fixed, '#A0ADA0')
  assert.ok(contrastRatio(fixed, '#f5f4ef') >= AA)
  // An alpha too low to ever reach the target gives up its transparency.
  assert.equal(readableColor('#b5695977', '#f5f4ef').length, 7)
  assert.equal(readableColor('inherit', '#f5f4ef'), 'inherit')
})

test('highlighted code clears AA against the background it is drawn on', () => {
  const background = /--code-bg:\s*(#[0-9a-f]{3,8})/i.exec(rendered.html)?.[1]
  assert.ok(background, 'the stylesheet defines a code background')
  // Shiki writes the theme background inline, where it would outrank the CSS.
  assert.match(rendered.html, new RegExp(`<pre class="shiki[^>]*background-color:${background}`))

  const colors = lightThemeColors(rendered.html)
  assert.ok(colors.length > 1, 'the fixture exercises more than one token color')
  for (const color of colors) {
    assert.ok(contrastRatio(color, background) >= AA, `${color} on ${background} fails AA`)
  }
})

test('the dark theme colors are left untouched for the unused custom property', () => {
  assert.match(rendered.html, /--shiki-dark:#[0-9A-Fa-f]{6}/)
})

test('a Table: line above a table becomes a screen-reader caption', () => {
  assert.match(rendered.html, /<table>\s*<caption class="visually-hidden">A <strong>sample<\/strong> table<\/caption>/)
  // The paragraph is consumed, not rendered: the prose already introduces it.
  assert.doesNotMatch(rendered.html, /<p>Table:/)
})

test('a table with no caption is reported and still rendered', async () => {
  const warnings = []
  const { html } = await renderNotesHtml(path.join(fixtures, 'notes', 'uncaptioned.md'), {
    warn: (message) => warnings.push(message)
  })

  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /table without a caption, under "A section"/)
  assert.match(html, /<table>\s*<thead>/)
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
