// Markdown -> self-contained HTML -> PDF.
//
// Used for both `notes.md` and `lab.md`: prose documents destined for an LMS,
// where a single file with no sibling assets is what both the page embed and
// the file upload want. Images are therefore embedded as data URIs.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import Shiki from '@shikijs/markdown-it'
import { repoRoot } from './lectures.mjs'

const TEMPLATE_PATH = path.join(repoRoot, 'shared', 'notes', 'template.html')
const CSS_PATH = path.join(repoRoot, 'shared', 'notes', 'notes.css')

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml'
}

let markdownPromise = null

/**
 * Build the Markdown renderer once per process. Shiki is async to load and
 * carries a full grammar set, so it is worth reusing across documents.
 */
function getMarkdown () {
  markdownPromise ??= (async () => {
    const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
    // Heading ids only: a visible permalink glyph after every heading is noise
    // in a printed document, and the id is what a deep link actually needs.
    md.use(anchor)
    // Matches Slidev's own highlighter, so code looks the same in notes and slides.
    md.use(await Shiki({ themes: { light: 'vitesse-light', dark: 'vitesse-dark' } }))
    // markdown-it emits a bare <th>, which accessibility checkers flag: a
    // header cell has to say what it heads. Markdown tables only ever have a
    // header row, so every <th> is a column header.
    md.renderer.rules.th_open = (tokens, idx, options, env, self) => {
      tokens[idx].attrSet('scope', 'col')
      return self.renderToken(tokens, idx, options)
    }
    return md
  })()
  return markdownPromise
}

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Replace root-relative `src` attributes with data URIs read from the
 * lecture's `public/` directory — the same directory Slidev serves at `/`,
 * so a diagram is authored once and referenced identically from both
 * documents. Paths that do not resolve are left alone and reported.
 */
async function inlineImages (html, publicDir, warn) {
  if (!publicDir) return html

  const sources = new Set()
  for (const match of html.matchAll(/src="(\/[^"]*)"/g)) sources.add(match[1])

  let result = html
  for (const src of sources) {
    const relative = decodeURIComponent(src.replace(/^\/+/, '').split(/[?#]/)[0])
    const filePath = path.join(publicDir, relative)

    if (!filePath.startsWith(publicDir + path.sep)) {
      warn(`image path escapes public/: ${src}`)
      continue
    }

    const mime = MIME_TYPES[path.extname(filePath).toLowerCase()]
    if (!mime) {
      warn(`unsupported image type, left as a link: ${src}`)
      continue
    }

    let data
    try {
      data = await readFile(filePath)
    } catch {
      warn(`image not found under public/, left as a link: ${src}`)
      continue
    }

    const dataUri = `data:${mime};base64,${data.toString('base64')}`
    result = result.split(`src="${src}"`).join(`src="${dataUri}"`)
  }
  return result
}

/**
 * Render one Markdown file to a complete, self-contained HTML document.
 * Returns the HTML plus the frontmatter title, which the PDF stage reuses.
 */
export async function renderNotesHtml (sourcePath, options = {}) {
  const { publicDir = null, warn = () => {} } = options

  const raw = await readFile(sourcePath, 'utf8')
  const { data, content } = matter(raw)
  const md = await getMarkdown()

  const title = typeof data.title === 'string' && data.title.trim()
    ? data.title.trim()
    : path.basename(sourcePath, '.md')
  const subtitle = typeof data.subtitle === 'string' && data.subtitle.trim()
    ? `<p class="doc-subtitle">${escapeHtml(data.subtitle.trim())}</p>`
    : ''

  const [template, css] = await Promise.all([
    readFile(TEMPLATE_PATH, 'utf8'),
    readFile(CSS_PATH, 'utf8')
  ])

  const body = await inlineImages(md.render(content), publicDir, warn)

  // Replacements go through a function so `$&`-style sequences in the
  // rendered body are treated as literal text.
  const fill = (haystack, token, value) => haystack.replaceAll(token, () => value)

  let html = fill(template, '{{title}}', escapeHtml(title))
  html = fill(html, '{{styles}}', css)
  html = fill(html, '{{subtitle}}', subtitle)
  html = fill(html, '{{content}}', body)

  return { html, title }
}

/**
 * Render `html` to a PDF. The HTML is self-contained, so `setContent` is
 * enough — no local server, no asset requests.
 */
export async function renderPdf (html, outputPath, { title } = {}) {
  const { chromium } = await import('playwright-chromium')

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.emulateMedia({ media: 'print' })
    await mkdir(path.dirname(outputPath), { recursive: true })
    await page.pdf({
      path: outputPath,
      format: 'Letter',
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:9px;color:#6f6d66;padding:0 1in;
                    font-family:-apple-system,Helvetica,Arial,sans-serif;
                    display:flex;justify-content:space-between;">
          <span>${escapeHtml(title ?? '')}</span>
          <span class="pageNumber"></span>
        </div>`
    })
  } finally {
    await browser.close()
  }
}

/**
 * Full pipeline for one prose document: write `<name>.html` and, unless
 * `pdf` is false, `<name>.pdf` into `outDir`. Returns the paths written,
 * with `pdfPath` null when the PDF was skipped.
 *
 * Skipping matters for short documents like an abstract, which is only ever
 * read as an LMS page: the PDF has no audience and costs a browser launch.
 */
export async function buildDocument (sourcePath, outDir, options = {}) {
  const { pdf = true, ...renderOptions } = options
  const name = path.basename(sourcePath, '.md')
  const { html, title } = await renderNotesHtml(sourcePath, renderOptions)

  await mkdir(outDir, { recursive: true })
  const htmlPath = path.join(outDir, `${name}.html`)
  const pdfPath = pdf ? path.join(outDir, `${name}.pdf`) : null

  await writeFile(htmlPath, html, 'utf8')
  if (pdfPath) await renderPdf(html, pdfPath, { title })

  return { htmlPath, pdfPath, title }
}
