/**
 * Just enough PDF reading to assert a document is tagged.
 *
 * A tagged PDF names a `/StructTreeRoot` in its catalog and sets `/Marked true`
 * — the structure an LMS accessibility checker reads. Naively grepping the file
 * for those strings gives false negatives: a writer may pack the catalog into a
 * FlateDecode object stream, where the bytes are compressed. Slidev does exactly
 * that, because it round-trips every export through pdf-lib to add metadata.
 *
 * So inflate every stream and search the plain and inflated text together. Node
 * builtins only — the kit's dependency list is deliberately short, and this is
 * not worth a PDF library.
 */

import { readFile } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'

const STREAM = Buffer.from('stream')
const ENDSTREAM = Buffer.from('endstream')

/** Every byte of `buf` that could hold a PDF name, decompressed where needed. */
function searchableText (buf) {
  const parts = [buf.toString('latin1')]

  let cursor = 0
  while ((cursor = buf.indexOf(STREAM, cursor)) !== -1) {
    // The keyword is followed by CRLF or LF before the stream data proper.
    let start = cursor + STREAM.length
    if (buf[start] === 0x0d) start += 1
    if (buf[start] === 0x0a) start += 1

    const end = buf.indexOf(ENDSTREAM, start)
    if (end === -1) break

    // Streams we cannot inflate are images, fonts, or content we do not need.
    try {
      parts.push(inflateSync(buf.subarray(start, end)).toString('latin1'))
    } catch {}

    cursor = end + ENDSTREAM.length
  }

  return parts.join('\n')
}

/** Whether the PDF at `pdfPath` carries an accessibility structure tree. */
export async function isTaggedPdf (pdfPath) {
  const text = searchableText(await readFile(pdfPath))
  return text.includes('/StructTreeRoot') && text.includes('/Marked true')
}

/** Whether `bytes` — an in-memory PDF — carries one. */
export function bufferIsTaggedPdf (bytes) {
  const text = searchableText(bytes)
  return text.includes('/StructTreeRoot') && text.includes('/Marked true')
}
