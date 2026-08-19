// Generates `dist/index.html`: a static table of contents for the built
// course, listing each lecture in order with links to whatever artifacts it
// actually produced.

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { lectureLabel } from './lectures.mjs'

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Artifact links, in the order they should be offered to a student. */
const ARTIFACTS = [
  { file: 'abstract.html', label: 'Abstract' },
  { file: 'slides/index.html', label: 'Slides' },
  { file: 'slides.pdf', label: 'Slides (PDF)' },
  { file: 'notes.html', label: 'Notes' },
  { file: 'notes.pdf', label: 'Notes (PDF)' },
  { file: 'lab.html', label: 'Lab' },
  { file: 'lab.pdf', label: 'Lab (PDF)' },
  { file: 'code', label: 'Code' }
]

function renderLecture (lecture, distDir) {
  const lectureDist = path.join(distDir, lecture.id)

  const links = ARTIFACTS
    .filter((artifact) => existsSync(path.join(lectureDist, artifact.file)))
    .map((artifact) => {
      const href = `./${lecture.id}/${artifact.file}`
      return `        <li><a href="${escapeHtml(href)}">${escapeHtml(artifact.label)}</a></li>`
    })

  const number = lecture.number ? `<span class="num">${escapeHtml(lecture.number)}</span>` : ''
  const body = links.length > 0
    ? `      <ul class="links">\n${links.join('\n')}\n      </ul>`
    : '      <p class="empty">Not built yet.</p>'

  return `    <li class="lecture">
      <h2>${number}${escapeHtml(lectureLabel(lecture))}</h2>
${body}
    </li>`
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
  .term { margin: 0.4rem 0 0; color: var(--muted); }
  ol.lectures { list-style: none; margin: 0; padding: 0; }
  .lecture { border-bottom: 1px solid var(--rule); padding: 1.25rem 0; }
  .lecture h2 { margin: 0 0 0.6rem; font-size: 1.1rem; display: flex; gap: 0.7rem; align-items: baseline; }
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

/** Write `dist/index.html` for the whole course. */
export async function writeIndex (lectures, course, distDir) {
  const title = course.title ?? 'Course'
  const term = course.term ? `<p class="term">${escapeHtml(course.term)}</p>` : ''

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
    <h1>${escapeHtml(title)}</h1>
${term ? `    ${term}` : ''}
  </header>
  <ol class="lectures">
${lectures.map((lecture) => renderLecture(lecture, distDir)).join('\n')}
  </ol>
</main>
</body>
</html>
`

  await mkdir(distDir, { recursive: true })
  const outPath = path.join(distDir, 'index.html')
  await writeFile(outPath, html, 'utf8')
  return outPath
}
