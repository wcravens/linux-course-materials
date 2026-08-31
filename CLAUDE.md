# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Course materials for a set of Linux courses, not an application. Each lecture is
a Slidev deck plus prose documents; one build produces HTML and PDFs for upload
to an LMS. Node 18+, ESM throughout (`"type": "module"`), no framework and no
transpile step.

The repository is an npm workspace with two packages — `course-kit/` (the build
tooling) and `slidev-addon-linux-courses/` (shared deck assets) — and any number
of courses under `courses/`. **A course is content, not software:** it has no
`package.json` and no dependencies, so the repository holds two `package.json`
files no matter how many courses exist. That is what keeps one `node_modules`
and one Chromium for the whole repository.

Alongside `courses/` sits `modules/`: self-contained tutorial material on one
topic — writing Markdown, building a VM — that belongs to no single course and
is included by name from any number of them. A module is content in exactly the
sense a course is, with no `package.json` of its own.

## Commands

Run from the workspace root:

```sh
npm run build                        # every course, every lecture
npm run build -- -c csc-118          # one course, every lecture
npm run build -- -c csc-118 01       # one course, one lecture
npm run dev   -- -c csc-118 01       # dev needs exactly one of each
npm run export                       # slide PDFs only
npm run notes                        # prose documents only (fast; no Slidev)
npm run new   -- -c csc-118 02 "Title"
npm run new   -- --module markdown "Writing Markdown"   # a shared module
npm run list                         # every course with its lectures and modules nested; a bare invocation also prints a workspace-wide module block
npm test                             # unit tests (fast, fixture-based)
npm run test:e2e                     # real build of CSC 118 lecture 01; launches a browser
```

Inside a course directory the course is implied and `-c` is unnecessary:

```sh
cd courses/csc-118-intro-to-linux && npx course build 01
```

Single test file or single test:

```sh
node --test course-kit/test/unit/notes.test.mjs
node --test --test-name-pattern="Shiki" course-kit/test/unit/notes.test.mjs
```

`npm run notes` is the fast feedback loop when editing prose — it skips Slidev
entirely. Prefer it over `npm run build` unless slides changed.

PDF rendering drives headless Chromium. If a build fails with a missing-browser
error, `npx playwright install chromium` (npm blocks the install script by
default).

### Selectors

There are two selector dimensions, resolved by the same machinery in
`content.mjs`.

A **content selector** is positional and names either a lecture or a module.
`build`, `export`, and `notes` take zero or more and operate on everything the
course holds when given none; `dev` requires exactly one. A lecture matches by
number, slug, or full directory name; a module, which carries no number, matches
by its directory name.

A **course selector** is the `-c` / `--course` flag, matching by code, slug, or
full directory name — `csc-118`, `csc118`, `intro-to-linux`, and
`csc-118-intro-to-linux` all name the same course. A flag rather than a second
positional argument, so the content-selector grammar is untouched.

Matching is **exact, not substring** in either dimension — `shell` does not
match `shell-basics`. Ambiguous and unknown selectors both error and name the
candidates.

## Architecture

`course-kit/src/course.mjs` is the CLI and the only orchestrator, reached through
`course-kit/bin/course.mjs` (the `course` bin, which npm links into the workspace
`node_modules/.bin`). It delegates to six modules: `content.mjs` (the shared
selector machinery and the kit's own root), `courses.mjs` (course discovery and
two of the three roots), `lectures.mjs` (lecture discovery), `modules.mjs`
(module discovery), `notes.mjs` (Markdown → HTML → PDF), `index.mjs` (a course's
index page).

### Discovery is the source of truth, three times

There is no course manifest, no lecture manifest, and no module manifest.
`discoverCourses()` lists `courses/*/` and keeps the directories holding a
`course.json`, reading the title from it; `discoverLectures()` lists one
course's `lectures/*/`, sorts by numeric prefix, and reads each title from the
`slides.md` frontmatter. Adding or renaming either requires no registration
anywhere.

`discoverModules()` lists `modules/*/`, reading each title from that
directory's `tutorial.md` frontmatter. `tutorial.md` marks a module the way
`slides.md` marks a lecture and `course.json` marks a course.

Modules are prose-first: `tutorial.md` is the only required file, and
`slides.md` is one more optional artifact. They are unnumbered, because a
module is a topic rather than a position in a sequence; a course's ordering
comes from the list in its `course.json`.

A course directory name parses as `<code>-<slug>`:
`csc-118-intro-to-linux` yields the code `csc-118` and the slug
`intro-to-linux`. A name that does not parse still matches by id.

`course.json` holds `{ title, base, modules }`, the last being the shared
modules this course includes, by name, in the order it wants them. Absent
means none. Resolution happens in `course.mjs` rather than `courses.mjs`,
because `modules/` hangs off the workspace root and a course does not know
about that.

**Terms are not modeled** — a course directory represents the course as
currently taught and is edited in place each semester, because rebuilding a
past term's artifacts is not a use case.

Per-entry optional artifacts are declared by two maps, at the top of
`lectures.mjs` for a lecture and, separately, at the top of `modules.mjs` for a
module:

```js
// lectures.mjs
const OPTIONAL_FILES = { abstract: 'abstract.md', lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }

// modules.mjs
const OPTIONAL_FILES = { abstract: 'abstract.md', notes: 'notes.md', lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }
```

A key becomes `<entry>.<key>Path` / `<entry>.<key>Dir`, null when absent.
Directories go through `hasContent()`, which ignores dotfiles, so a scaffolded
`code/.gitkeep` does not count as "this entry has code".

These two maps are declared separately and deliberately differ: a lecture's
required document is `slides.md`, and `notesPath` is computed apart from its
`OPTIONAL_FILES`; a module's required document is `tutorial.md` instead, and
`notes` lives inside its `OPTIONAL_FILES` map. **To add a new per-entry document
type, both maps must be touched** — updating only `lectures.mjs` leaves modules
without it, silently — plus `buildProse()` in `course.mjs` and `ARTIFACTS` in
`index.mjs`. Do not try to unify the two maps; the divergence is intentional.

### Three roots

The tooling once hung every path off a single `repoRoot`. It now resolves three:

| Root | Resolved from | Owns |
|---|---|---|
| `packageRoot` | `import.meta.url` (`content.mjs`) | `course-kit/assets/notes/*`, `course-kit/templates/` |
| `courseRoot` | cwd, or `--course` | `course.json`, `lectures/`, `dist/` |
| `workspaceRoot` | nearest ancestor with `node_modules/.bin/slidev` | the Slidev binary, `courses/`, and `modules/` |

`selectCourses()` decides which courses a command runs against: `--course` wins
wherever it is typed, so one course can be built from inside another; otherwise a
cwd inside a course means that course, found by walking up for a `course.json`
the way git finds `.git`; above every course, a bare invocation means all of
them. `dev` and `new` act on one course and error naming the candidates when the
answer is not unique.

`workspaceRoot` is defined by the Slidev binary because the kit spawns Slidev
rather than importing it, and `@slidev/cli` therefore stays a root dependency
while the kit's own imports — `markdown-it`, `markdown-it-anchor`,
`@shikijs/markdown-it`, `gray-matter`, `playwright-chromium` — live in
`course-kit/package.json`.

### The shared machinery lives in `content.mjs`

Lectures, modules, and courses are all named the same way, so the selector
machinery — exact matching, ambiguity detection, and the errors that list the
candidates — lives in `content.mjs` and each content module depends on it.
It used to live in `lectures.mjs`, which meant `courses.mjs` imported from
`lectures.mjs`; a third importer made that plainly wrong.

Every descriptor carries a `kind` — `'lecture'`, `'module'`, or `'course'` —
and `matchesSelector()` picks its aliases from the entry rather than from its
`kind` argument, which is now only the noun an error message uses. That is what
lets one list hold lectures and modules and resolve correctly over both.

### Slidev's userRoot constraint drives the layout

Slidev's `userRoot` is the directory containing the entry Markdown file, and it
resolves `public/`, `components/`, `styles/`, `setup/`, and `--out` relative to
that directory — per lecture, not per repo. Verified against the installed
Slidev 52.19.0: `resolver-BIhhHpe7.mjs:274` (userRoot), `serve-CY7V3bOt.mjs:590`
(asset dirs), `build-rtQk8gSn.mjs:39` (`--out`). Re-check these if Slidev is
upgraded. Two consequences that are easy to break:

- The runner passes **absolute** `--out` paths.
- Decks build **one at a time**. Every entry file is named `slides.md` and
  Slidev derives multi-entry output paths from the entry basename, so parallel
  builds collide.

Shared deck assets are not affected, because the addon is a real npm package:
Slidev prefixes a bare addon name with `slidev-addon-` and resolves it through
Node from the importing `slides.md` (`resolver-BIhhHpe7.mjs:227-244`), which
walks up to the workspace `node_modules` where npm symlinks workspace packages.
Deck frontmatter is therefore just:

```yaml
addons:
  - 'slidev-addon-linux-courses'
```

One addon is shared by every course. If a course ever needs to diverge, Slidev
already reads a per-`userRoot` `styles/` directory, so the escape hatch exists
without designing for it now.

Deck styles in the addon are scoped under `.slidev-layout` because Slidev's own
client styles would otherwise outrank a bare element selector.

### The prose pipeline

`abstract.md`, `tutorial.md`, `notes.md`, and `lab.md` all go through the same
renderer (`notes.mjs`) — there is no per-type template. `buildDocument()`
derives the output name from the source basename, so a new document type needs
no change there at all. Abstracts opt out of the PDF stage: a paragraph-length
PDF has no audience and costs a browser launch.

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
`course-kit/assets/notes/template.html`; then Playwright takes that same HTML
through `page.setContent()` and `page.pdf()` — Letter, one-inch margins, page
numbers in the footer. No local server is involved, precisely because the HTML is
self-contained. The template and stylesheet hang off `packageRoot`: they belong
to the tooling, not to any course.

markdown-it runs with `html: true`, `linkify`, and `typographer` (so `--` becomes
an en dash and quotes become curly — avoid literal `--` in prose). Code is
highlighted with Shiki using the same themes Slidev uses, so code looks nearly
identical in both.

Nearly, because prose is held to WCAG AA (4.5:1) and vitesse-light was designed
for a screen-lit editor: its comment gray is 2.3:1 on paper. A Shiki transformer
in `notes.mjs` darkens *only* the light-theme colors that fail, in the rendered
output, keeping the hue — the slides are unaffected. The same transformer
rewrites the theme background Shiki writes inline on the `<pre>`, which would
otherwise outrank `--code-bg` from the stylesheet; that variable is parsed out of
`notes.css` so the two cannot drift.

Accessibility is a real constraint on this output, not a nicety. Table headers
carry `scope`, colors are checked against the background they actually land on,
and every table needs a `<caption>` — which Markdown cannot express, so a
`Table: ...` paragraph directly above a table is consumed into one by a core
rule in `notes.mjs`. Captions are `.visually-hidden`: the prose already
introduces each table, and a drawn caption would repeat it. A table without a
caption warns through `env.warn` rather than failing the build, which is why
`md.render()` is passed an env.

Playwright is already required by `slidev export`, so the prose pipeline adds
only `markdown-it`, `markdown-it-anchor`, `@shikijs/markdown-it`, and
`gray-matter`. Keep it that lean.

Data-URI images inflate the HTML. That cost was accepted deliberately for prose
carrying a handful of diagrams, and is worth revisiting only if a document ever
becomes image-heavy.

`courses/csc-118-intro-to-linux/lectures/01-what-is-linux/public/distro-family-tree.png`
is 6 MB; referencing it from prose would inline ~8 MB of base64 into `notes.html`.

### The lecture template is shared

`course-kit/templates/lecture/` scaffolds a lecture for *any* course, so it names
no course itself. `cmdNew()` substitutes four tokens: `{{TITLE}}`, `{{NUMBER}}`,
`{{COURSE}}` (the code as prose — `csc-118` becomes `CSC 118`), and
`{{COURSE_TITLE}}`.

### Output

Each course builds into its own `dist/`, which is gitignored and built locally,
then uploaded by hand — there is no deployment automation. Decks build with
`--router-mode hash` and a relative base from `course.json`, so the SPA works
from whatever path the LMS serves it at without a rebuild. If a relative base
ever stops working under an LMS, the fallback is an explicit path in
`course.json`'s `base` rather than a code change.

A module renders into each including course's `dist/modules/<id>/`, so a
course's `dist/` stays the entire upload for that course with no sibling
assets and no cross-upload links. A module included by two courses is rendered
twice, once into each. That is the accepted cost of a self-contained upload;
rendering a prose document is a second of work.

Deliberately out of scope for this repo: deployment automation, and anything
student-submission related — assignment grading, solution keys, rosters.

## Tests

`node:test` and `node:assert` only; no test dependencies. Unit tests run against
`course-kit/test/fixtures/`, never against the real `courses/` — a new fixture
course or lecture is how you test discovery behavior. The e2e test builds CSC 118
lecture 01 for real and is separate solely because it launches a browser.

## Reversibility

Extracting `course-kit/` into its own repository later is a `git subtree split`
away, at which point courses install it by git URL. Nothing in this layout has to
be redone to get there.
