// Slow: these launch a headless browser to prove the shim reaches Playwright.
// Kept out of `npm test` for that reason — run them with `npm run test:e2e`.

import test from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { SHIM_PATH } from '../../src/tagged-pdf.mjs'
import { bufferIsTaggedPdf } from '../helpers/pdf.mjs'

/** Render a trivial page and hand back the resulting PDF bytes. */
async function pdfBytes (pdfOptions) {
  const { chromium } = await import('playwright-chromium')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<h1>Structure</h1>')
    return await page.pdf({ format: 'Letter', ...pdfOptions })
  } finally {
    await browser.close()
  }
}

test('without the shim, Playwright writes an untagged PDF', { timeout: 120_000 }, async () => {
  // Establishes the baseline the shim has to change. If this ever starts
  // finding a structure tree, Playwright changed its default and the shim
  // — and all of this — can go.
  assert.equal(bufferIsTaggedPdf(await pdfBytes({})), false)
})

test('importing the shim defaults page.pdf to tagged', { timeout: 120_000 }, async () => {
  await import(pathToFileURL(SHIM_PATH).href)
  assert.ok(bufferIsTaggedPdf(await pdfBytes({})), 'the deck gains a structure tree')
})

test('an explicit tagged:false still wins over the shim default', { timeout: 120_000 }, async () => {
  await import(pathToFileURL(SHIM_PATH).href)
  assert.equal(bufferIsTaggedPdf(await pdfBytes({ tagged: false })), false)
})
