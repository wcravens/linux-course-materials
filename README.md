# CSC 118 — Introduction to Linux (Fall 2026)

Course materials: a [Slidev](https://sli.dev) deck, prose notes, and optional lab
handouts and example code for each lecture. One command builds the whole
semester into `dist/` as HTML for LMS page embeds and PDFs for LMS file uploads.

## Requirements

- **Node.js 18+** (developed against Node 26, npm 11)

## Setup

```sh
npm install
```

Slide export and PDF rendering run a headless browser, which is why
`playwright-chromium` is a dev dependency. Recent npm versions block package
install scripts by default, so the Chromium **binary** may not have been
downloaded during `npm install`. If a build fails with a missing-browser error,
fetch it explicitly:

```sh
npx playwright install chromium
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev -- 01` | Start the Slidev dev server for one lecture and open it |
| `npm run build` | Build every lecture, then regenerate `dist/index.html` |
| `npm run build -- 01` | Build one lecture |
| `npm run export` | Export slide PDFs only |
| `npm run notes` | Render abstracts, notes, and lab documents only |
| `npm run new -- 02 "Filesystem Basics"` | Scaffold a new lecture |
| `npm run list` | List the lectures in this course |
| `npm test` | Fast unit tests |
| `npm run test:e2e` | Full build of lecture 01 (slow; launches a browser) |

### Selectors

A selector names a lecture by its number, its slug, or its full directory name.
These are all the same lecture:

```sh
npm run dev -- 01
npm run dev -- what-is-linux
npm run dev -- 01-what-is-linux
```

Matching is exact, not substring — `shell` will not match `shell-basics`. An
unknown selector prints the available lectures; an ambiguous one names the
candidates. `build`, `export`, and `notes` operate on every lecture when given
no selector; `dev` requires exactly one.

Presenter view (notes, timer, next-slide preview) is at
<http://localhost:3030/presenter> while `npm run dev` is running.

## Adding a lecture

```sh
npm run new -- 02 "Filesystem Basics"
```

This copies `templates/lecture/` to `lectures/02-filesystem-basics/`,
substituting the number and title into the `slides.md`, `abstract.md`, and
`notes.md` frontmatter. It refuses to overwrite an existing directory. There is no manifest
to update: the runner discovers lectures by listing `lectures/*/` and reads each
title from the deck's frontmatter.

## Layout

```
lectures/
└── 01-what-is-linux/
    ├── slides.md   # Slidev deck
    ├── abstract.md # short module summary for the LMS home page
    ├── notes.md    # prose notes
    ├── lab.md      # optional; built only when present
    ├── public/     # images, shared by slides and notes
    └── code/       # example scripts and config files
shared/
├── slidev-addon-csc118/  # components, layouts, and styles for every deck
└── notes/                # HTML template and stylesheet for prose documents
scripts/                  # the build runner
templates/lecture/        # scaffold source for `npm run new`
course.json               # course title, term, and deploy base
```

Everything one lecture needs sits in its own directory, so a lecture can be
moved or archived as a unit and optional artifacts need no parallel numbering
elsewhere.

`public/` is per-lecture because Slidev resolves it relative to the deck, and
serves it at `/`. The notes renderer resolves root-relative image paths against
that same directory, so `![Diagram](/diagram.png)` works identically in
`slides.md` and `notes.md`.

## Build output

```
dist/
├── index.html                       # course index, links to every artifact
└── 01-what-is-linux/
    ├── slides/                      # Slidev SPA, iframe-embeddable
    ├── slides.pdf
    ├── abstract.html                # HTML only; no PDF
    ├── notes.html
    ├── notes.pdf
    └── code/
```

`dist/` is gitignored and built locally. Decks build with `--router-mode hash`
and a relative base (`course.json`'s `base`), so the SPA works from whatever
path the LMS serves it at without a rebuild.

`notes.html` and `lab.html` are single self-contained files — the stylesheet is
inlined and images are embedded as data URIs — which is what both an LMS page
embed and an LMS file upload want.

## Authoring

### Slides

Slides are separated by `---` on its own line. A block of YAML immediately after
a separator sets options for the slide that follows:

```md
---
layout: two-cols
---

# Slide title
```

Decks use the `seriph` theme and four layouts: `cover` (title slide), `section`
(unit dividers), `two-cols`, and the default. See the
[Slidev syntax guide](https://sli.dev/guide/syntax) and the
[built-in layouts](https://sli.dev/builtin/layouts) for the rest.

Speaker notes go in an HTML comment as the **last** thing in a slide:

```md
<!-- Mention that the kernel stays resident for the whole session. -->
```

They appear in presenter view only.

Useful keys while presenting:

| Key | Action |
| --- | --- |
| <kbd>space</kbd> / <kbd>→</kbd> | Next slide |
| <kbd>←</kbd> | Previous slide |
| <kbd>o</kbd> | Slide overview |
| <kbd>d</kbd> | Toggle dark mode |
| <kbd>f</kbd> | Fullscreen |

### Shared deck assets

Course-wide components, layouts, and styles live in
`shared/slidev-addon-csc118/` and are pulled in by each deck's frontmatter:

```yaml
addons:
  - '@/../../shared/slidev-addon-csc118'
```

Slidev resolves `@/` against the deck's own directory. A bare `../../` would
*not* work here: Slidev applies `dirname()` to the importer before resolving a
relative addon path, so it would land one level above the repository.

The addon currently supplies two style modules:

- `styles/tables.css` — table typography plus the `.notes` block used for source
  footnotes under a table or figure.
- `styles/viz.css` — the `.viz` palette for hand-authored SVG charts, with light
  and dark tokens.

Both are scoped under `.slidev-layout`, because Slidev's own client styles use
that class and would otherwise outrank a bare element selector.

### Abstracts, notes, and labs

`abstract.md`, `notes.md`, and `lab.md` are plain Markdown with a frontmatter
`title` and optional `subtitle`. All three go through the same renderer — there
is no separate template per document type. Code blocks are highlighted with
Shiki, the same highlighter Slidev uses, so code looks identical in the notes
and on the slides.

Headings get `id` attributes, so you can deep-link to a section of the notes
from an LMS page. PDFs are rendered at Letter size with one-inch margins and page
numbers in the footer.

Give every table a caption. Write it on its own line directly above the table:

```md
Table: Operating system market share by segment

| Segment | Linux-based | Windows |
| --- | ---: | ---: |
```

The line is consumed, not printed — it becomes the table's `<caption>`, read
aloud by a screen reader before the cells and drawn nowhere, since the prose
above each table already introduces it. A table without one still builds, but
the run reports it.

`abstract.md` is a short summary — around 200 words — meant to be pasted or
embedded as the module's home page in the LMS. It renders to HTML only; a PDF of
a paragraph has no audience, so that stage is skipped. `notes.md` and `lab.md`
each produce both HTML and PDF.

All three files are optional in the sense that the build skips what is absent,
but a lecture with none of them is reported as a warning.

## Tests

`npm test` runs the fast unit tests: lecture discovery, selector resolution, and
notes rendering, all against fixtures under `test/fixtures/` rather than the real
`lectures/`. `npm run test:e2e` builds lecture 01 for real and checks every
artifact; it is separate because it launches a headless browser.
