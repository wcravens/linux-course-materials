// Generates a course's `dist/index.html`: a static table of contents for the
// built course, listing each lecture in order with links to whatever artifacts
// it actually produced.

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { entryLabel } from './content.mjs'

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Artifact links, in the order they should be offered to a student. A
    module's tutorial is its primary document, so it sits directly after the
    abstract; one list serves both kinds, since it filters by what exists.

    A lecture never contributes `abstract.html` — the abstract belongs to the
    course and is linked from the header — but a module still can. */
const ARTIFACTS = [
  { file: 'abstract.html', label: 'Abstract' },
  { file: 'tutorial.html', label: 'Tutorial' },
  { file: 'tutorial.pdf', label: 'Tutorial (PDF)' },
  { file: 'slides/index.html', label: 'Slides' },
  { file: 'slides.pdf', label: 'Slides (PDF)' },
  { file: 'notes.html', label: 'Notes' },
  { file: 'notes.pdf', label: 'Notes (PDF)' },
  { file: 'lab.html', label: 'Lab' },
  { file: 'lab.pdf', label: 'Lab (PDF)' },
  { file: 'code', label: 'Code' }
]

/** An entry's directory inside `dist/`, and the href prefix that reaches it.
    Mirrors `outDirFor` in course.mjs — modules live under `modules/`. */
function entryPaths (entry, distDir) {
  const segments = entry.kind === 'module' ? ['modules', entry.id] : [entry.id]
  return {
    dir: path.join(distDir, ...segments),
    href: `./${segments.join('/')}`
  }
}

function renderEntry (entry, distDir) {
  const { dir, href } = entryPaths(entry, distDir)

  const links = ARTIFACTS
    .filter((artifact) => existsSync(path.join(dir, artifact.file)))
    .map((artifact) => {
      const target = `${href}/${artifact.file}`
      return `        <li><a href="${escapeHtml(target)}">${escapeHtml(artifact.label)}</a></li>`
    })

  const number = entry.number ? `<span class="num">${escapeHtml(entry.number)}</span>` : ''
  const body = links.length > 0
    ? `      <ul class="links">\n${links.join('\n')}\n      </ul>`
    : '      <p class="empty">Not built yet.</p>'

  return `    <li class="entry">
      <h3>${number}${escapeHtml(entryLabel(entry))}</h3>
${body}
    </li>`
}

/** One titled section of the index. Omitted entirely when it holds nothing. */
function renderSection (heading, entries, distDir) {
  if (entries.length === 0) return ''
  return `  <h2 class="section">${escapeHtml(heading)}</h2>
  <ol class="entries">
${entries.map((entry) => renderEntry(entry, distDir)).join('\n')}
  </ol>`
}

const STYLES = `
  :root {
    --ink: #16150f;
    --ink-2: #52514e;
    --muted: #6f6d66;
    --rule: #d9d7cc;
    --accent: #2a78d6;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #fbfaf6;
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.55;
  }
  main { max-width: 46rem; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
  header { border-bottom: 1px solid var(--rule); padding-bottom: 1.25rem; margin-bottom: 2rem; }
  h1 { margin: 0; font-size: 1.9rem; }
  p.course-abstract { margin: 0.55rem 0 0; font-size: 0.9rem; }
  p.course-abstract a { color: var(--accent); text-decoration: none; }
  h2.section {
    margin: 2.25rem 0 0.5rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-weight: 600;
    color: var(--muted);
  }
  h2.section:first-of-type { margin-top: 0; }
  ol.entries { list-style: none; margin: 0; padding: 0; }
  .entry { border-bottom: 1px solid var(--rule); padding: 1.25rem 0; }
  .entry h3 {
    margin: 0 0 0.6rem;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    gap: 0.7rem;
    align-items: baseline;
  }
  .num { color: var(--muted); font-variant-numeric: tabular-nums; font-weight: 400; }
  ul.links { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
  ul.links a {
    display: inline-block;
    padding: 0.25rem 0.7rem;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: #fff;
    color: var(--accent);
    text-decoration: none;
    font-size: 0.85rem;
  }
  .empty { margin: 0; color: var(--muted); font-size: 0.85rem; }
  footer { margin-top: 2.5rem; color: var(--muted); font-size: 0.8rem; }
  @media (prefers-color-scheme: dark) {
    :root { --ink: #f2f1ea; --ink-2: #c3c2b7; --muted: #898781; --rule: #383835; --accent: #79b0f2; }
    body { background: #16150f; }
    ul.links a { background: #201f18; }
  }
`

/**
 * Write `dist/index.html` for one course: its lectures in order, then the
 * shared modules it includes. Two sections mean the page needs real heading
 * levels — a flat run of `h2`s would misrepresent a document with two parts.
 */
export async function writeIndex (lectures, modules, course) {
  const distDir = course.distDir
  const title = entryLabel(course)

  const sections = [
    renderSection('Lectures', lectures, distDir),
    renderSection('Modules', modules, distDir)
  ].filter(Boolean).join('\n')

  // The course abstract describes the whole course, so it belongs in the
  // header rather than in either section's list of entries.
  const abstract = existsSync(path.join(distDir, 'abstract.html'))
    ? '\n    <p class="course-abstract"><a href="./abstract.html">Course abstract</a></p>'
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
  <header>
    <h1>${escapeHtml(title)}</h1>${abstract}
  </header>
${sections}
</main>
</body>
</html>
`

  await mkdir(distDir, { recursive: true })
  const outPath = path.join(distDir, 'index.html')
  await writeFile(outPath, html, 'utf8')
  return outPath
}
