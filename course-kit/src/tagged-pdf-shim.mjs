/**
 * Make every PDF Playwright writes in this process a tagged one.
 *
 * Loaded through `--import` into the `slidev export` subprocess, which calls
 * `page.pdf()` with hardcoded options and offers no way to add `tagged: true`.
 * See `tagged-pdf.mjs` for why this exists at all.
 *
 * We wrap the public API — `launch` → `newContext`/`newPage` → `pdf` — rather
 * than reaching into Slidev's internals, so a Slidev upgrade cannot silently
 * break it: either the wrapper still fits Playwright's surface or it throws.
 *
 * `playwright-chromium` is a bare re-export of `playwright-core`, so patching
 * the object here reaches Slidev no matter which specifier it resolves.
 */

import playwright from 'playwright-core'

/** Wrap one method of `target` in place, given a wrapper over the original. */
function patch (target, name, wrap) {
  const original = target[name]
  if (typeof original !== 'function') {
    throw new TypeError(`[tagged-pdf] expected ${name}() on the Playwright object`)
  }
  target[name] = wrap(original)
}

/** Default `tagged` on, while leaving an explicit choice by the caller alone. */
function patchPage (page) {
  patch(page, 'pdf', (pdf) => function (options = {}) {
    return pdf.call(this, { tagged: true, ...options })
  })
  return page
}

function patchPageFactory (target, name) {
  patch(target, name, (create) => async function (...args) {
    return patchPage(await create.apply(this, args))
  })
}

patch(playwright.chromium, 'launch', (launch) => async function (...args) {
  const browser = await launch.apply(this, args)
  // Slidev takes both routes: `browser.newPage()` for the presenter export and
  // `browser.newContext().newPage()` for the slide export.
  patchPageFactory(browser, 'newPage')
  patch(browser, 'newContext', (newContext) => async function (...contextArgs) {
    const context = await newContext.apply(this, contextArgs)
    patchPageFactory(context, 'newPage')
    return context
  })
  return browser
})
