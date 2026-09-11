/**
 * Tagged PDF output.
 *
 * A PDF carries its accessibility structure — headings, lists, tables, figure
 * alt text — in a structure tree, which Chromium emits only when asked. Our own
 * prose pipeline asks directly (`tagged: true` in `notes.mjs`). Slide PDFs
 * cannot: they come from a `slidev export` subprocess whose `page.pdf()` options
 * are hardcoded, with no flag to pass this one through.
 *
 * So we hand that subprocess a `--import` shim that defaults the option on
 * Playwright itself. The env composition lives here, apart from the shim, so it
 * can be tested without launching anything.
 *
 * Delete both files if Slidev ever ships a `--tagged` flag of its own.
 */

import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** The shim, resolved from this module so it survives being installed anywhere. */
export const SHIM_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'tagged-pdf-shim.mjs'
)

// A file URL rather than a bare path: NODE_OPTIONS splits on whitespace, and
// the checkout can live under a directory whose name has a space in it.
const IMPORT_FLAG = `--import ${pathToFileURL(SHIM_PATH).href}`

/**
 * Return a copy of `env` that makes a child `node` process emit tagged PDFs.
 *
 * Additive and idempotent: an existing NODE_OPTIONS is kept, and applying this
 * to an env that already carries the shim is a no-op.
 */
export function taggedPdfEnv (env = process.env) {
  const existing = env.NODE_OPTIONS ?? ''
  if (existing.includes(IMPORT_FLAG)) return { ...env }
  return { ...env, NODE_OPTIONS: existing ? `${existing} ${IMPORT_FLAG}` : IMPORT_FLAG }
}
