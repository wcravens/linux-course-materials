# course-kit

The build tooling for this repository's courses: the `course` command, the
Markdown-to-PDF prose renderer, the course index page, and the lecture and
module scaffolds.

It is a workspace package rather than a published one — npm links its `course`
bin into the workspace `node_modules/.bin`, which is what the root `npm run`
scripts call. See the [root README](../README.md) for day-to-day usage; this
file is about how the kit works from the inside.

## The command

```
course <command> [-c <course>] [selector...]

  dev <selector>        Start the Slidev dev server for one lecture or module
  build [selector...]   Slides, PDFs, prose documents, and the course index
  export [selector...]  Slide PDFs only
  notes [selector...]   Abstracts, tutorials, notes, and lab documents only
  new <NN> <title>      Scaffold a new lecture from templates/lecture/
  new --module <slug> <title>
                        Scaffold a new shared module from templates/module/
  list                  Courses, their lectures, and their modules
```

`build`, `export`, and `notes` run once per selected course and take any number
of content selectors — lecture or module — operating on everything the course
holds when given none. `dev` and a lecture-scaffolding `new` act on one lecture
or module of a single course, so they fail with the candidates listed when the
course is not unambiguous. `new --module` takes no course at all: a module is
scaffolded at the workspace root and belongs to no course until one includes it.

## Modules

`src/course.mjs` is the CLI and the only orchestrator; everything else is a
library it calls.

| Module | Responsibility |
| --- | --- |
| `course.mjs` | argument parsing, the commands, spawning Slidev |
| `content.mjs` | the selector machinery lecture, module, and course discovery share, and `packageRoot` |
| `courses.mjs` | course discovery, two of the three roots, which courses a command runs against |
| `lectures.mjs` | lecture discovery |
| `modules.mjs` | module discovery |
| `notes.mjs` | Markdown → self-contained HTML → PDF |
| `index.mjs` | a course's `dist/index.html` |

`bin/course.mjs` is four lines: it imports `cli()` and hands it `argv`.

Non-code assets travel with the kit rather than with any course:
`assets/notes/` holds the prose template and stylesheet, `templates/lecture/`
holds the scaffold `npm run new` copies, and `templates/module/` holds the one
`npm run new -- --module` copies.

## Discovery is the source of truth, three times

There is no course manifest, no lecture manifest, and no module manifest.

`discoverCourses()` lists `courses/*/` and keeps the directories holding a
`course.json`, reading the title from it. `discoverLectures()` lists one
course's `lectures/*/`, sorts by numeric prefix, and reads each title from the
`slides.md` frontmatter. `discoverModules()` lists `modules/*/`, sorted by
directory name since a module carries no number, and reads each title from
that directory's `tutorial.md` frontmatter — `tutorial.md` marks a module the
way `slides.md` marks a lecture. Adding or renaming any of the three requires
no registration anywhere.

A directory under `courses/` with no `course.json` is skipped silently — a
course announces itself with a file. A directory under `lectures/` with no
`slides.md`, or under `modules/` with no `tutorial.md`, is *reported*, because
each is identified by being there and a missing primary document is far more
likely to be a mistake than an intention — though for a module that report
only fires for a course that actually includes it; `modules/` is shared, so a
half-written module nobody has included yet must not break an unrelated
course's build.

## Three roots

The kit once hung every path off a single repository root. It resolves three:

| Root | Resolved from | Owns |
| --- | --- | --- |
| `packageRoot` | `import.meta.url` in `content.mjs` | `assets/notes/`, `templates/` |
| `courseRoot` | the cwd, or `-c` | `course.json`, `lectures/`, `dist/` |
| `workspaceRoot` | nearest ancestor holding `node_modules/.bin/slidev` | the Slidev binary, `courses/`, and `modules/` |

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

Both selector dimensions — the positional content selector and the `-c` course
flag — go through the same code in `content.mjs`. Every descriptor carries its
own `kind`; `matchesSelector()` picks its aliases from the entry rather than
from the `kind` argument, which is now only the noun an error message uses.
That is what lets one list hold lectures and modules and resolve correctly
over both.

| Kind | Matches by | Normalization |
| --- | --- | --- |
| lecture | number, slug, directory name | leading zeros ignored, so `1` finds `01` |
| module | directory name (a module has no number, so no slug distinct from it) | compared as written |
| course | code, slug, directory name | hyphens ignored, so `csc118` finds `csc-118` |

Matching is **exact, not substring**: `shell` does not match `shell-basics`.
Both an unknown selector and an ambiguous one throw a `SelectorError` naming
the candidates, which the CLI prints without a stack trace — the fault is in
the argument, not in the code.

## Building a lecture or module

`cmdBuild()` runs four steps per entry — a lecture or an included module,
deliberately **one deck at a time**: every entry file is named `slides.md`, and
Slidev derives multi-entry output paths from the entry basename, so parallel
builds collide.

1. `slidev build` with an **absolute** `--out` (Slidev resolves `--out`
   relative to the deck's own directory), `--base` from `course.json`, and
   `--router-mode hash`, so the SPA works from whatever path the LMS serves it
   at without a rebuild. Skipped for a module with no `slides.md` — a module
   needs no deck.
2. `slidev export` for `slides.pdf`, same skip.
3. `buildProse()` for whichever of `tutorial.md`, `notes.md`, and `lab.md` the
   entry has — plus `abstract.md` for a module, which owns one.
4. `copyCode()` for `code/`, dotfiles excluded.

A lecture's artifacts land in `dist/<id>/`; a module's land in
`dist/modules/<id>/`, so a module's id can never collide with a lecture
directory name. A module included by more than one course is built once per
including course, straight into that course's own `dist/`.

`buildCourseAbstract()` then renders the course's own `abstract.md`, if it has
one, to `dist/abstract.html`. It takes a course rather than an entry and sits
outside the per-entry loop, because the abstract describes the course as a
whole rather than any one lecture. HTML only, like a module's abstract.

Then `writeIndex()` writes `dist/index.html` for the course — lectures, then
the modules it includes — linking only the artifacts that actually exist on
disk, with the course abstract linked from the header rather than from either
section.

## The prose pipeline

`abstract.md`, `tutorial.md`, `notes.md`, and `lab.md` all go through
`buildDocument()` — there is no per-type template, and no distinction between a
document a course owns and one an entry owns beyond the output directory. It derives the output name
from the source basename and writes `<name>.html` and, unless `pdf: false`,
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
- Root-relative image `src` paths resolve against the entry's own `public/` —
  a lecture's or a module's, the same directory Slidev serves at `/` — and
  become data URIs. A path that does not resolve is warned about and left as a
  link rather than failing the build.
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
const OPTIONAL_FILES = { lab: 'lab.md' }
const OPTIONAL_DIRS = { code: 'code', public: 'public' }
```

A key becomes `lecture.<key>Path` / `lecture.<key>Dir`, null when absent. Then
wire it into `buildProse()` in `course.mjs` and `ARTIFACTS` in `index.mjs`.
Directories go through `hasContent()`, which ignores dotfiles, so a scaffolded
`code/.gitkeep` does not read as "this lecture has code". `modules.mjs` keeps
the parallel maps for a module (`notes` and `lab` alongside `abstract`, since a
module also has no numbering scheme to keep separate).

**A course-level document** is a different shape: it hangs off `readCourse()`
in `courses.mjs` rather than either map, and needs its own render step beside
`buildCourseAbstract()`. `abstract.md` is the only one today. Reach for this
only when the document genuinely describes the course rather than a meeting of
it — otherwise it belongs in the per-entry maps above.

**A new command** is a function plus an entry in `PER_COURSE` (runs once per
selected course) or `SINGLE_COURSE` (needs exactly one). Throw `UserError` for
anything the user typed wrong: it prints as a bare message instead of a stack
trace.

**The lecture template** scaffolds a lecture for *any* course, so it names none
itself. `cmdNew()` substitutes `{{TITLE}}`, `{{NUMBER}}`, `{{COURSE}}` (the code
as prose — `csc-118` becomes `CSC 118`), and `{{COURSE_TITLE}}` into
`slides.md` and `notes.md`. It ships no `abstract.md`, because a lecture has
no abstract to scaffold.

**The module template** scaffolds a module the same way, but takes no course
and no number: `cmdNewModule()` substitutes only `{{TITLE}}` into `tutorial.md`
and `abstract.md`. The slug is given explicitly on the command line rather than
derived from the title, because it is the stable name every including
`course.json` references and must not churn when the title is reworded.

## Tests

`node:test` and `node:assert` only; no test dependencies.

```sh
npm test                                        # unit; fast, no browser
npm run test:e2e                                # builds CSC 118 lecture 01 for real
node --test test/unit/notes.test.mjs            # one file
node --test --test-name-pattern="Shiki" test/unit/notes.test.mjs
```

Unit tests run against `test/fixtures/`, never against the real `courses/` — a
new fixture course, lecture, or module is how discovery behavior gets tested.
The e2e test is separate solely because it launches a browser; if it fails
with a missing-browser error, run `npx playwright install chromium` (npm
blocks the install script by default).

## Reversibility

Nothing here reaches outside the package except by spawning Slidev and by
reading `courses/` and `modules/` under the workspace root. Extracting the kit
into its own repository is a `git subtree split` away, at which point courses
install it by git URL. This layout does not have to be redone to get there.
