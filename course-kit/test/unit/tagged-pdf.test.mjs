import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { stat } from 'node:fs/promises'
import { taggedPdfEnv, SHIM_PATH } from '../../src/tagged-pdf.mjs'

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src')

test('the shim it points at is a real file in the kit', async () => {
  assert.equal(SHIM_PATH, path.join(srcDir, 'tagged-pdf-shim.mjs'))
  // A typo here would only surface as a child process crashing mid-export.
  assert.ok((await stat(SHIM_PATH)).isFile(), 'the shim must exist to be imported')
})

test('a clean env gains a --import of the shim, as a file URL', () => {
  const env = taggedPdfEnv({ PATH: '/usr/bin' })
  assert.equal(env.PATH, '/usr/bin', 'the rest of the env is carried through')
  assert.equal(env.NODE_OPTIONS, `--import ${pathToFileURL(SHIM_PATH).href}`)
})

test('an existing NODE_OPTIONS is kept, not clobbered', () => {
  const env = taggedPdfEnv({ NODE_OPTIONS: '--max-old-space-size=8192' })
  assert.match(env.NODE_OPTIONS, /^--max-old-space-size=8192 --import /)
})

test('applying it twice does not import the shim twice', () => {
  const once = taggedPdfEnv({})
  const twice = taggedPdfEnv(once)
  assert.equal(twice.NODE_OPTIONS, once.NODE_OPTIONS)
})

test('the caller env is not mutated', () => {
  const original = { NODE_OPTIONS: '--trace-warnings' }
  taggedPdfEnv(original)
  assert.equal(original.NODE_OPTIONS, '--trace-warnings')
})

test('a file URL is used because a bare path breaks on spaces', () => {
  // The kit is checked out wherever the user put it; NODE_OPTIONS splits on
  // whitespace, so a path with a space must arrive percent-encoded.
  const url = taggedPdfEnv({}).NODE_OPTIONS.replace('--import ', '')
  assert.doesNotMatch(url, / /)
  assert.match(url, /^file:\/\//)
})
