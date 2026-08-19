# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Course materials for CSC 118 (Introduction to Linux), not an application. Each
lecture is a Slidev deck plus prose documents; one build produces HTML and PDFs
for upload to an LMS. Node 18+, ESM throughout (`"type": "module"`), no
framework and no transpile step.

## Commands

```sh
npm run dev -- 01            # Slidev dev server for one lecture (requires exactly one selector)
npm run build                # every lecture: slides, PDFs, prose, dist/index.html
npm run build -- 01          # one lecture
npm run export               # slide PDFs only
npm run notes                # prose documents only (fast; no Slidev)
npm run new -- 02 "Title"    # scaffold lectures/02-title/ from templates/lecture/
npm run list                 # lectures and the artifacts each one has
npm test                     # unit tests (fast, fixture-based)
npm run test:e2e             # real build of lecture 01; launches a browser
```

Single test file or single test:

```sh
node --test test/unit/notes.test.mjs
node --test --test-name-pattern="Shiki" test/unit/notes.test.mjs
```

`npm run notes` is the fast feedback loop when editing prose — it skips Slidev
entirely. Prefer it over `npm run build` unless slides changed.

PDF rendering drives headless Chromium. If a build fails with a missing-browser
error, `npx playwright install chromium` (npm blocks the install script by
default).

### Selectors

`build`, `export`, and `notes` take zero or more selectors and operate on every
lecture when given none; `dev` requires exactly one. A selector matches a
lecture by number, slug, or full directory name, and matching is **exact, not
substring** — `shell` does not match `shell-basics`. Ambiguous and unknown
selectors both error and name the candidates.

## Architecture

`scripts/course.mjs` is the CLI and the only orchestrator. It delegates to three
modules: `lectures.mjs` (discovery and selectors), `notes.mjs` (Markdown → HTML →
PDF), `index.mjs` (the course index page).

### Discovery is the source of truth

There is no lecture manifest. `discoverLectures()` lists `lectures/*/`, sorts by
numeric prefix, and reads each title from the `slides.md` frontmatter. Adding or
renaming a lecture requires no registration anywhere. `course.json` holds only
course-level metadata (title, term, deploy base).

Per-lecture optional artifacts are declared by two maps at the top of
`lectures.mjs`:

```js
const OPTIONAL_FILES = { abstract: 'abstract.md', lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }
```

A key becomes `lecture.<key>Path` / `lecture.<key>Dir`, null when absent. **To add
a new per-lecture document type, add it here** — then wire it into `buildProse()`
in `course.mjs` and `ARTIFACTS` in `index.mjs`. Directories go through
`hasContent()`, which ignores dotfiles, so a scaffolded `code/.gitkeep` does not
count as "this lecture has code".

### Slidev's userRoot constraint drives the layout

Slidev's `userRoot` is the directory containing the entry Markdown file, and it
resolves `public/`, `components/`, `styles/`, `setup/`, and `--out` relative to
that directory — per lecture, not per repo. Verified against the installed
Slidev 52.19.0: `resolver-BIhhHpe7.mjs:274` (userRoot), `serve-CY7V3bOt.mjs:590`
(asset dirs), `build-rtQk8gSn.mjs:39` (`--out`). Re-check these if Slidev is
upgraded; the layout below depends on them. Three consequences that are easy to
break:

- The runner passes **absolute** `--out` paths.
- Repo-root `components/`/`styles/` would be invisible to every deck, so shared
  deck assets live in `shared/slidev-addon-csc118/` and each deck pulls them in
  via frontmatter as `'@/../../shared/slidev-addon-csc118'`. The `@/` prefix is
  required: Slidev applies `dirname()` to the importer before resolving a
  relative addon path, so a bare `../../` lands one level above the repo.
  Local themes and addons accept four path forms (`resolver-BIhhHpe7.mjs:228-231`):
  `/absolute`, `./relative` and `../relative` resolved against the importer, and
  `@/path` resolved against `userRoot`. Shared assets therefore never needed to
  be a published npm package.
- Decks build **one at a time**. Every entry file is named `slides.md` and
  Slidev derives multi-entry output paths from the entry basename, so parallel
  builds collide.

Deck styles in the addon are scoped under `.slidev-layout` because Slidev's own
client styles would otherwise outrank a bare element selector.

### The prose pipeline

`abstract.md`, `notes.md`, and `lab.md` all go through the same renderer
(`notes.mjs`) — there is no per-type template. `buildDocument()` writes
`<name>.html` and, unless `pdf: false`, `<name>.pdf`. Abstracts opt out: a
paragraph-length PDF has no audience and costs a browser launch.

Output is deliberately **self-contained** — CSS inlined into a `<style>` element,
images embedded as data URIs — because both an LMS page embed and an LMS file
upload want a single file with no sibling assets. Image inlining resolves
root-relative `src` paths against the lecture's `public/`, the same directory
Slidev serves at `/`, so `![x](/diagram.png)` works identically in `slides.md`
and in prose. Unresolvable paths are warned about and left as links rather than
failing the build.

The stages: `gray-matter` splits the frontmatter (`title` supplies the document
heading and the PDF metadata); markdown-it renders, with `markdown-it-anchor`
for heading IDs and `@shikijs/markdown-it` for code; the result is injected into
`shared/notes/template.html`; then Playwright takes that same HTML through
`page.setContent()` and `page.pdf()` — Letter, one-inch margins, page numbers in
the footer. No local server is involved, precisely because the HTML is
self-contained.

markdown-it runs with `html: true`, `linkify`, and `typographer` (so `--` becomes
an en dash and quotes become curly — avoid literal `--` in prose). Code is
highlighted with Shiki using the same themes Slidev uses, so code looks identical
in both.

Playwright is already required by `slidev export`, so the prose pipeline adds
only `markdown-it`, `markdown-it-anchor`, `@shikijs/markdown-it`, and
`gray-matter`. Keep it that lean.

Data-URI images inflate the HTML. That cost was accepted deliberately for prose
carrying a handful of diagrams, and is worth revisiting only if a document ever
becomes image-heavy.

`public/distro-family-tree.png` is 6 MB; referencing it from prose would inline
~8 MB of base64 into `notes.html`.

### Output

`dist/` is gitignored and built locally, then uploaded by hand — there is no
deployment automation. Decks build with `--router-mode hash` and a relative base
from `course.json`, so the SPA works from whatever path the LMS serves it at
without a rebuild. If a relative base ever stops working under an LMS, the
fallback is an explicit path in `course.json`'s `base` rather than a code change.

Deliberately out of scope for this repo: deployment automation, and anything
student-submission related — assignment grading, solution keys, rosters.

## Tests

`node:test` and `node:assert` only; no test dependencies. Unit tests run against
`test/fixtures/`, never the real `lectures/` — a new fixture lecture is how you
test discovery behavior. The e2e test is separate solely because it launches a
browser.
