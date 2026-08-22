# slidev-addon-linux-courses

Components, layouts, and styles shared by every lecture deck in this repository.

A [Slidev addon](https://sli.dev/addons/use) is a package whose `components/`,
`layouts/`, and `styles/` directories are merged into a deck's own. This one is a
workspace package rather than a published one: npm symlinks it into the
workspace `node_modules`, so decks resolve it by name without a registry, a
version bump, or an install step.

One addon serves every course. If a course ever has to diverge, Slidev also
reads a `styles/` directory next to the deck itself, so the escape hatch already
exists.

## Using it from a deck

The scaffold in `course-kit/templates/lecture/` already includes this, so a
lecture created with `npm run new` needs no further wiring:

```yaml
---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
---
```

Slidev prefixes a bare addon name with `slidev-addon-` and resolves it through
Node from the directory holding `slides.md`, which walks up to the workspace
`node_modules`. Nothing is imported by hand: every directory below is picked up
by convention.

## What it provides

```
components/   # auto-registered in every deck, by filename
layouts/      # selectable as `layout:` in slide frontmatter, by filename
styles/       # index.css is auto-imported into every deck
```

`components/` and `layouts/` are empty for now — the decks use Slidev's built-in
layouts (`cover`, `section`, `two-cols`, and the default). They are kept as
placeholders because the moment a `.vue` file lands in either one, it is live in
every deck with no other change.

`styles/index.css` is the entry point and does nothing but import the modules
beside it. Add a new module there when adding a file.

### `styles/tables.css`

Table typography — slightly smaller text and tighter cell padding than Slidev's
default, which is sized for prose rather than for a table read from the back of
a room.

It also defines `.notes`, the small-print block for source citations and
footnotes under a table or figure:

```html
<div class="notes">

<sup>a</sup> Percentages overlap, so this column does not total 100%

Sources: [StatCounter](https://example.org) Dec 2025 · [W3Techs](https://example.org) Aug 2026

</div>
```

The blank lines matter: Markdown inside an HTML block is only rendered when the
content is separated from the tags.

### `styles/viz.css`

A palette and element styles for hand-authored SVG charts, with light and dark
tokens so a chart follows the deck when <kbd>d</kbd> is pressed. Wrap the SVG in
`.viz` and class its elements:

| Class | Element |
| --- | --- |
| `.bar` | a bar or other filled data mark |
| `.cat` | a category label along the axis |
| `.val` | a value label at the end of a mark |
| `.base` | the axis line |
| `.cap` | the caption paragraph below the chart |

```html
<div class="viz">
<svg viewBox="0 0 800 60" role="img" aria-label="Linux share of web servers: 92 percent.">
  <line class="base" x1="190" y1="14" x2="190" y2="46" />
  <text class="cat" x="178" y="30" text-anchor="end" dominant-baseline="middle">Web servers</text>
  <path class="bar" d="M190 22 H655 A4 4 0 0 1 659 26 V38 A4 4 0 0 1 655 42 H190 Z" />
  <text class="val" x="669" y="30" dominant-baseline="middle">92%</text>
</svg>

<p class="cap">The desktop is the one place Linux lost — and the only place most people look.</p>

</div>
```

The `<svg>` carries `role="img"` and an `aria-label` that states the figures,
because a screen reader gets nothing from the geometry. Lecture 01 of CSC 118
has a full five-bar example.

## Editing

Deck styles are scoped under `.slidev-layout`. Slidev's own client styles set
things like `.slidev-layout td, .slidev-layout th { padding: .75rem .5rem }`, and
a bare `table td` loses to that on specificity. A rule written without the prefix
will appear to do nothing.

CSS here reaches the slides only. Prose documents — abstracts, notes, labs — are
rendered by `course-kit` against `course-kit/assets/notes/notes.css`, which is a
separate stylesheet held to WCAG AA for print. Changing one does not change the
other.

There is no build step and no test for this package: it is static assets, and
`npm run dev -- -c csc-118 01` hot-reloads a stylesheet as it is saved.
