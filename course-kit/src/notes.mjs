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
import { packageRoot } from './lectures.mjs'

// The template and stylesheet travel with the tooling, not with a course, so
// they hang off the kit's own root rather than the course being built.
const TEMPLATE_PATH = path.join(packageRoot, 'assets', 'notes', 'template.html')
const CSS_PATH = path.join(packageRoot, 'assets', 'notes', 'notes.css')

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml'
}

// WCAG AA for body-size text is 4.5:1; code is set at 0.82rem, so the
// large-text allowance of 3:1 does not apply. The extra tenth is headroom, so
// a checker that rounds differently than we do still agrees.
const CONTRAST_TARGET = 4.6
const FALLBACK_CODE_BG = '#ffffff'

/**
 * Split `#rgb`, `#rrggbb`, or `#rrggbbaa` into channels plus alpha.
 * Returns null for anything else, so callers can leave it untouched.
 */
function parseColor (value) {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(String(value).trim())?.[1]
  if (!hex) return null

  const expand = hex.length <= 4 ? (c) => c + c : (c) => c
  const pairs = hex.length <= 4 ? hex.split('') : hex.match(/../g)
  if (pairs.length < 3 || pairs.length > 4) return null

  const [r, g, b, a] = pairs.map((c) => parseInt(expand(c), 16))
  return { rgb: [r, g, b], alpha: a === undefined ? 1 : a / 255, hasAlpha: a !== undefined }
}

function formatColor ({ rgb, alpha, hasAlpha }) {
  const byte = (value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
  return '#' + rgb.map(byte).join('') + (hasAlpha ? byte(alpha * 255) : '')
}

function relativeLuminance ([r, g, b]) {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * WCAG contrast between a foreground and an opaque background. A translucent
 * foreground is composited onto the background first, which is what the
 * browser draws and what an accessibility checker measures.
 */
export function contrastRatio (foreground, background) {
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  if (!fg || !bg) return null

  const composited = fg.rgb.map((value, i) => value * fg.alpha + bg.rgb[i] * (1 - fg.alpha))
  const [light, dark] = [relativeLuminance(composited), relativeLuminance(bg.rgb)]
    .sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Darken `foreground` until it clears `target` against `background`, keeping
 * the hue by scaling all three channels together. Translucent colors are tried
 * at their own alpha first and only made opaque if that cannot reach the
 * target — a 47%-opaque color tops out around 2.9:1 on a light background.
 * Returns the color unchanged when it already passes.
 */
export function readableColor (foreground, background, target = CONTRAST_TARGET) {
  const fg = parseColor(foreground)
  if (!fg || !parseColor(background)) return foreground
  if (contrastRatio(foreground, background) >= target) return foreground

  for (const hasAlpha of fg.hasAlpha ? [true, false] : [false]) {
    for (let scale = 100; scale >= 0; scale -= 1) {
      const candidate = formatColor({
        rgb: fg.rgb.map((value) => (value * scale) / 100),
        alpha: fg.alpha,
        hasAlpha
      })
      if (contrastRatio(candidate, background) >= target) return candidate
    }
  }
  return '#000000'
}

/**
 * Shiki themes are designed for a screen-lit editor, not for print. Several of
 * vitesse-light's token colors fail WCAG AA on paper — its comment gray sits at
 * 2.3:1 — so rather than abandon the theme (and its match with the slides),
 * darken only the colors that fail, in the rendered output where the exact
 * colors Shiki chose are visible.
 *
 * Only the light theme is touched. Shiki emits the dark theme as unused
 * `--shiki-dark` custom properties; the prose stylesheet has no dark mode, and
 * a PDF is printed on white regardless.
 */
function contrastTransformer (background) {
  const readableStyle = (style) => style
    .replace(/(^|;)(\s*)color:\s*(#[0-9a-f]{3,8})/gi,
      (_, sep, space, color) => `${sep}${space}color:${readableColor(color, background)}`)
    .replace(/(^|;)(\s*)background-color:\s*#[0-9a-f]{3,8}/gi,
      (_, sep, space) => `${sep}${space}background-color:${background}`)

  const walk = (node) => {
    if (typeof node.properties?.style === 'string') {
      node.properties.style = readableStyle(node.properties.style)
    }
    for (const child of node.children ?? []) walk(child)
  }

  return { name: 'course-kit:contrast', root: walk }
}

/**
 * The background a code block is drawn on, read from the stylesheet so the
 * highlighter and the CSS cannot drift apart. Shiki writes the theme's own
 * background onto the `<pre>` inline, which would otherwise silently win.
 */
async function codeBackground () {
  const css = await readFile(CSS_PATH, 'utf8')
  return /--code-bg:\s*(#[0-9a-f]{3,8})/i.exec(css)?.[1] ?? FALLBACK_CODE_BG
}

/**
 * `Table: ...` on its own line, immediately above a table, becomes that
 * table's `<caption>`. Markdown has no caption syntax, and a table without one
 * gives a screen reader nothing to announce before it starts reading cells.
 *
 * The paragraph is consumed rather than rendered: the caption is drawn
 * off-screen (see `.visually-hidden` in notes.css), because these documents
 * already introduce each table in the surrounding prose and a visible caption
 * would say the same thing twice.
 *
 * A table with no caption paragraph is reported through `env.warn` and rendered
 * as before — a missing caption should not fail a build.
 */
function tableCaptions (md) {
  const CAPTION = /^Table:\s*/

  md.core.ruler.push('table_captions', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i].type !== 'table_open') continue

      const inline = tokens[i - 2]
      const isCaption = tokens[i - 3]?.type === 'paragraph_open' &&
        inline?.type === 'inline' &&
        CAPTION.test(inline.content)

      if (!isCaption) {
        const heading = tokens.slice(0, i).reverse().find((t) => t.type === 'inline')
        state.env?.warn?.(`table without a caption${heading ? `, under "${heading.content}"` : ''}`)
        continue
      }

      inline.children = md.parseInline(inline.content.replace(CAPTION, ''), state.env)[0].children
      tokens[i].meta = { ...tokens[i].meta, caption: inline }
      tokens.splice(i - 3, 3)
      i -= 3
    }
  })

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    const caption = tokens[idx].meta?.caption
    const open = self.renderToken(tokens, idx, options)
    if (!caption) return open
    return `${open}<caption class="visually-hidden">` +
      `${self.renderInline(caption.children, options, env)}</caption>\n`
  }
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
    md.use(await Shiki({
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      transformers: [contrastTransformer(await codeBackground())]
    }))
    tableCaptions(md)
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

  const body = await inlineImages(md.render(content, { warn }), publicDir, warn)

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
