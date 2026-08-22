# course-kit

The build tooling for this repository's courses: the `course` command, the
Markdown-to-PDF prose renderer, the course index page, and the lecture scaffold.

It is a workspace package rather than a published one — npm links its `course`
bin into the workspace `node_modules/.bin`, which is what the root `npm run`
scripts call. See the [root README](../README.md) for day-to-day usage; this
file is about how the kit works from the inside.

## The command

```
course <command> [-c <course>] [selector...]

  dev <selector>        Start the Slidev dev server for one lecture
  build [selector...]   Slides, PDFs, prose documents, and the course index
  export [selector...]  Slide PDFs only
  notes [selector...]   Abstracts, notes, and lab documents only
  new <NN> <title>      Scaffold a new lecture from templates/lecture/
  list                  Courses and their lectures
```

`build`, `export`, and `notes` run once per selected course and take any number
of lecture selectors, operating on every lecture when given none. `dev` and
`new` act on a single lecture of a single course, so they fail with the
candidates listed when the course is not unambiguous.

## Modules

`src/course.mjs` is the CLI and the only orchestrator; everything else is a
library it calls.

| Module | Responsibility |
| --- | --- |
| `course.mjs` | argument parsing, the commands, spawning Slidev |
| `courses.mjs` | course discovery, the three roots, which courses a command runs against |
| `lectures.mjs` | lecture discovery, and the selector machinery both dimensions share |
| `notes.mjs` | Markdown → self-contained HTML → PDF |
| `index.mjs` | a course's `dist/index.html` |

`bin/course.mjs` is four lines: it imports `cli()` and hands it `argv`.

Non-code assets travel with the kit rather than with any course:
`assets/notes/` holds the prose template and stylesheet, `templates/lecture/`
holds the scaffold `npm run new` copies.

## Discovery is the source of truth, twice

There is no course manifest and no lecture manifest.

`discoverCourses()` lists `courses/*/` and keeps the directories holding a
`course.json`, reading the title from it. `discoverLectures()` lists one
course's `lectures/*/`, sorts by numeric prefix, and reads each title from the
`slides.md` frontmatter. Adding or renaming either requires no registration
anywhere.

A directory under `courses/` with no `course.json` is skipped silently — a
course announces itself with a file. A directory under `lectures/` with no
`slides.md` is *reported*, because a lecture is identified by being there and a
missing deck is far more likely to be a mistake than an intention.

## Three roots

The kit once hung every path off a single repository root. It resolves three:

| Root | Resolved from | Owns |
| --- | --- | --- |
| `packageRoot` | `import.meta.url` in `lectures.mjs` | `assets/notes/`, `templates/lecture/` |
| `courseRoot` | the cwd, or `-c` | `course.json`, `lectures/`, `dist/` |
| `workspaceRoot` | nearest ancestor holding `node_modules/.bin/slidev` | the Slidev binary, and `courses/` |

`workspaceRoot` is defined by the Slidev binary because the kit **spawns**
Slidev rather than importing it. That is also why `@slidev/cli` is a root
dependency while the kit's own imports — `markdown-it`, `markdown-it-anchor`,
`@shikijs/markdown-it`, `gray-matter`, `playwright-chromium` — are declared
here.

`selectCourses()` decides what a command runs against: `-c` wins wherever it is
typed, so one course can be built from inside another; otherwise a cwd inside a
course means that course, found by walking up for a `course.json` the way git
finds `.git`; above every course, a bare invocation means all of them.

## Selectors

Both selector dimensions go through the same code in `lectures.mjs` — a `kind`
argument supplies the aliases and the noun for the error message.

| Kind | Matches by | Normalization |
| --- | --- | --- |
| lecture | number, slug, directory name | leading zeros ignored, so `1` finds `01` |
| course | code, slug, directory name | hyphens ignored, so `csc118` finds `csc-118` |

Matching is **exact, not substring**: `shell` does not match `shell-basics`.
Both an unknown selector and an ambiguous one throw a `SelectorError` naming
the candidates, which the CLI prints without a stack trace — the fault is in
the argument, not in the code.

## Building a lecture

`cmdBuild()` runs four steps per lecture, deliberately **one deck at a time**:
every entry file is named `slides.md`, and Slidev derives multi-entry output
paths from the entry basename, so parallel builds collide.

1. `slidev build` with an **absolute** `--out` (Slidev resolves `--out`
   relative to the deck's own directory), `--base` from `course.json`, and
   `--router-mode hash`, so the SPA works from whatever path the LMS serves it
   at without a rebuild.
2. `slidev export` for `slides.pdf`.
3. `buildProse()` for whichever of `abstract.md`, `notes.md`, and `lab.md` the
   lecture has.
4. `copyCode()` for `code/`, dotfiles excluded.

Then `writeIndex()` writes `dist/index.html` for the course, linking only the
artifacts that actually exist on disk.

## The prose pipeline

`abstract.md`, `notes.md`, and `lab.md` all go through `buildDocument()` — there
is no per-type template. It writes `<name>.html` and, unless `pdf: false`,
`<name>.pdf`. Abstracts opt out: a paragraph-length PDF has no audience and
costs a browser launch.

Output is deliberately **self-contained** — CSS inlined into a `<style>`
element, images embedded as data URIs — because both an LMS page embed and an
LMS file upload want one file with no sibling assets. That is also what lets the
PDF stage use Playwright's `setContent()` with no local server.

The stages:

- `gray-matter` splits the frontmatter; `title` supplies the heading and the PDF
  footer, `subtitle` is optional.
- markdown-it renders with `html`, `linkify`, and `typographer` — so `--`
  becomes an en dash and quotes curl. Avoid a literal `--` in prose.
- `markdown-it-anchor` adds heading ids (no visible permalink glyph — the id is
  what a deep link needs, and the glyph is noise in print).
- `@shikijs/markdown-it` highlights code with the same themes Slidev uses, so
  code looks nearly identical in both places.
- Root-relative image `src` paths resolve against the lecture's `public/`, the
  same directory Slidev serves at `/`, and become data URIs. A path that does
  not resolve is warned about and left as a link rather than failing the build.
- The HTML fills `assets/notes/template.html`; Playwright prints it at Letter
  with one-inch margins and page numbers in the footer.

### Accessibility is a constraint here, not a nicety

Three things in `notes.mjs` exist only for it:

- **Contrast.** vitesse-light was designed for a screen-lit editor; its comment
  gray is 2.3:1 on paper. A Shiki transformer darkens *only* the light-theme
  colors that fail 4.6:1, keeping the hue, in the rendered output. The slides
  are unaffected. The same transformer rewrites the theme background Shiki
  writes inline on the `<pre>`, which would otherwise outrank `--code-bg`; that
  value is parsed out of `notes.css` so the two cannot drift.
- **Table captions.** Markdown cannot express a `<caption>`, so a core rule
  consumes a `Table: ...` paragraph directly above a table into one. Captions
  are `.visually-hidden`: the prose already introduces each table, and a drawn
  caption would repeat it. A table without one warns through `env.warn` rather
  than failing — which is why `md.render()` is passed an env.
- **Header scope.** Every `<th>` gets `scope="col"`; Markdown tables only ever
  have a header row.

Playwright is already required by `slidev export`, so the prose pipeline adds
only four small dependencies. Keep it that lean. Data-URI images inflate the
HTML — a cost accepted for prose carrying a handful of diagrams, worth
revisiting only if a document becomes image-heavy.

## Extending

**A new per-lecture document type** starts with the two maps at the top of
`lectures.mjs`:

```js
const OPTIONAL_FILES = { abstract: 'abstract.md', lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }
```

A key becomes `lecture.<key>Path` / `lecture.<key>Dir`, null when absent. Then
wire it into `buildProse()` in `course.mjs` and `ARTIFACTS` in `index.mjs`.
Directories go through `hasContent()`, which ignores dotfiles, so a scaffolded
`code/.gitkeep` does not read as "this lecture has code".

**A new command** is a function plus an entry in `PER_COURSE` (runs once per
selected course) or `SINGLE_COURSE` (needs exactly one). Throw `UserError` for
anything the user typed wrong: it prints as a bare message instead of a stack
trace.

**The lecture template** scaffolds a lecture for *any* course, so it names none
itself. `cmdNew()` substitutes `{{TITLE}}`, `{{NUMBER}}`, `{{COURSE}}` (the code
as prose — `csc-118` becomes `CSC 118`), and `{{COURSE_TITLE}}` into
`slides.md`, `abstract.md`, and `notes.md`.

## Tests

`node:test` and `node:assert` only; no test dependencies.

```sh
npm test                                        # unit; fast, no browser
npm run test:e2e                                # builds CSC 118 lecture 01 for real
node --test test/unit/notes.test.mjs            # one file
node --test --test-name-pattern="Shiki" test/unit/notes.test.mjs
```

Unit tests run against `test/fixtures/`, never against the real `courses/` — a
new fixture course or lecture is how discovery behavior gets tested. The e2e
test is separate solely because it launches a browser; if it fails with a
missing-browser error, run `npx playwright install chromium` (npm blocks the
install script by default).

## Reversibility

Nothing here reaches outside the package except by spawning Slidev and by
reading `courses/` under the workspace root. Extracting the kit into its own
repository is a `git subtree split` away, at which point courses install it by
git URL. This layout does not have to be redone to get there.
