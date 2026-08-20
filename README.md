# Linux courses

Course materials for a set of Linux courses: a [Slidev](https://sli.dev) deck,
prose notes, and optional lab handouts and example code for each lecture. One
command builds a whole semester into that course's `dist/` as HTML for LMS page
embeds and PDFs for LMS file uploads.

The repository holds every course plus the tooling that builds them, so a fix to
the build reaches every course at once.

## Requirements

- **Node.js 18+** (developed against Node 26, npm 11)

## Setup

```sh
npm install
```

Slide export and PDF rendering run a headless browser, which is why
`playwright-chromium` is a dependency. Recent npm versions block package install
scripts by default, so the Chromium **binary** may not have been downloaded
during `npm install`. If a build fails with a missing-browser error, fetch it
explicitly:

```sh
npx playwright install chromium
```

## Commands

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `npm run build` | Build every course, then regenerate each one's `dist/index.html` |
| `npm run build -- -c csc-118` | Build one course |
| `npm run build -- -c csc-118 01` | Build one lecture of one course |
| `npm run dev -- -c csc-118 01` | Start the Slidev dev server for one lecture and open it |
| `npm run export` | Export slide PDFs only |
| `npm run notes` | Render abstracts, notes, and lab documents only |
| `npm run new -- -c csc-118 02 "Filesystem Basics"` | Scaffold a new lecture |
| `npm run list` | List every course with its lectures |
| `npm test` | Fast unit tests |
| `npm run test:e2e` | Full build of CSC 118 lecture 01 (slow; launches a browser) |

Presenter view (notes, timer, next-slide preview) is at
<http://localhost:3030/presenter> while `npm run dev` is running.

### Choosing a course

Inside a course directory the course is implied, and the tool behaves exactly as
it did when the repository held one course:

```sh
cd courses/csc-118-intro-to-linux
npx course build 01
npx course list
```

Above the courses — at the repository root — `-c` (long form `--course`) says
which one. Without it, `build`, `export`, `notes`, and `list` cover every course;
`dev` and `new` act on a single lecture, so they ask for `-c` when the answer is
not already unique.

A course selector matches by code, slug, or full directory name. These all name
the same course:

```sh
npm run build -- -c csc-118
npm run build -- -c csc118
npm run build -- -c intro-to-linux
npm run build -- -c csc-118-intro-to-linux
```

### Lecture selectors

A lecture selector names a lecture by its number, its slug, or its full directory
name. These are all the same lecture:

```sh
npm run dev -- -c csc-118 01
npm run dev -- -c csc-118 what-is-linux
npm run dev -- -c csc-118 01-what-is-linux
```

Matching is exact, not substring — `shell` will not match `shell-basics`. An
unknown selector prints what was available; an ambiguous one names the
candidates. `build`, `export`, and `notes` operate on every lecture when given no
selector; `dev` requires exactly one.

## Adding a lecture

```sh
npm run new -- -c csc-118 02 "Filesystem Basics"
```

This copies `course-kit/templates/lecture/` to the course's
`lectures/02-filesystem-basics/`, substituting the lecture number and title and
the course's own name into the `slides.md`, `abstract.md`, and `notes.md`
frontmatter. It refuses to overwrite an existing directory. There is no manifest
to update: the runner discovers lectures by listing `lectures/*/` and reads each
title from the deck's frontmatter.

## Adding a course

Create a directory under `courses/` named `<code>-<slug>` and give it a
`course.json`:

```sh
mkdir -p courses/csc-171-linux-administration
cat > courses/csc-171-linux-administration/course.json <<'EOF'
{
  "title": "CSC 171 — Linux Administration",
  "base": "./"
}
EOF
npm run new -- -c csc-171 01 "Users and Groups"
```

That is the whole registration step. A course has no `package.json` and no
dependencies of its own — it is content, and the tooling and the shared deck
addon are the only packages in the repository.

`course.json` holds a title and a deploy base, nothing else. Terms are not
modeled: a course directory is the course as currently taught, edited in place
each semester.

## Layout

```
courses/
└── csc-118-intro-to-linux/
    ├── course.json          # course title and deploy base
    ├── lectures/
    │   └── 01-what-is-linux/
    │       ├── slides.md    # Slidev deck
    │       ├── abstract.md  # short module summary for the LMS home page
    │       ├── notes.md     # prose notes
    │       ├── lab.md       # optional; built only when present
    │       ├── public/      # images, shared by slides and notes
    │       └── code/        # example scripts and config files
    └── dist/                # build output; gitignored
course-kit/                  # the build tooling, as a workspace package
├── bin/course.mjs           # the `course` command
├── src/                     # CLI, discovery, prose renderer, index page
├── assets/notes/            # HTML template and stylesheet for prose documents
├── templates/lecture/       # scaffold source for `npm run new`
└── test/
slidev-addon-linux-courses/  # components, layouts, and styles for every deck
```

Everything one lecture needs sits in its own directory, so a lecture can be moved
or archived as a unit and optional artifacts need no parallel numbering
elsewhere. The same is true one level up: a course is a directory, and moving or
retiring it touches nothing else.

`public/` is per-lecture because Slidev resolves it relative to the deck, and
serves it at `/`. The notes renderer resolves root-relative image paths against
that same directory, so `![Diagram](/diagram.png)` works identically in
`slides.md` and `notes.md`.

## Build output

```
courses/csc-118-intro-to-linux/dist/
├── index.html                       # course index, links to every artifact
└── 01-what-is-linux/
    ├── slides/                      # Slidev SPA, iframe-embeddable
    ├── slides.pdf
    ├── abstract.html                # HTML only; no PDF
    ├── notes.html
    ├── notes.pdf
    └── code/
```

`dist/` is gitignored and built locally, per course. Decks build with
`--router-mode hash` and a relative base (`course.json`'s `base`), so the SPA
works from whatever path the LMS serves it at without a rebuild.

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

Components, layouts, and styles shared by every deck in every course live in
`slidev-addon-linux-courses/`, a workspace package that each deck pulls in by
name:

```yaml
addons:
  - 'slidev-addon-linux-courses'
```

Slidev prefixes a bare addon name with `slidev-addon-` and resolves it through
Node, which finds it in the workspace `node_modules` where npm symlinks workspace
packages.

The addon currently supplies two style modules:

- `styles/tables.css` — table typography plus the `.notes` block used for source
  footnotes under a table or figure.
- `styles/viz.css` — the `.viz` palette for hand-authored SVG charts, with light
  and dark tokens.

Both are scoped under `.slidev-layout`, because Slidev's own client styles use
that class and would otherwise outrank a bare element selector.

One addon serves every course. Should a course need to diverge, Slidev also reads
a `styles/` directory next to a deck.

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

`npm test` runs the fast unit tests: course and lecture discovery, selector
resolution, root resolution, and notes rendering, all against fixtures under
`course-kit/test/fixtures/` rather than against the real `courses/`.
`npm run test:e2e` builds CSC 118 lecture 01 for real and checks every artifact;
it is separate because it launches a headless browser.
