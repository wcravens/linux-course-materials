# CSC 118 — Lecture 1: What is Linux?

A [Slidev](https://sli.dev) presentation deck. The slides live in a single file,
[`slides.md`](./slides.md); [`lecture-1_what-is-linux.md`](./lecture-1_what-is-linux.md)
is the original prose the deck was built from.

## Requirements

- **Node.js 18+** (developed against Node 26, npm 11)

## Setup

```sh
npm install
```

## Presenting

```sh
npm run dev
```

Starts the dev server and opens <http://localhost:3030>. The deck hot-reloads as you
edit `slides.md`, so you can fix a typo mid-review without restarting.

Useful keys while presenting:

| Key | Action |
| --- | --- |
| <kbd>space</kbd> / <kbd>→</kbd> | Next slide |
| <kbd>←</kbd> | Previous slide |
| <kbd>o</kbd> | Slide overview |
| <kbd>d</kbd> | Toggle dark mode |
| <kbd>f</kbd> | Fullscreen |

Presenter view (notes, timer, next-slide preview) is at
<http://localhost:3030/presenter>.

## Building a static site

```sh
npm run build
```

Outputs a self-contained static site to `dist/`. It can be served from any web host
or opened locally; no Node runtime is required to view it.

## Exporting to PDF

```sh
npm run export
```

Writes `slides-export.pdf` (23 pages, one per slide).

Export renders the deck in a headless browser, which is why `playwright-chromium`
is a dev dependency. Recent npm versions block package install scripts by default,
so the Chromium **binary** may not have been downloaded during `npm install`. If
export fails with a missing-browser error, fetch it explicitly:

```sh
npx playwright install chromium
```

## Editing the deck

Slides are separated by `---` on its own line. A block of YAML immediately after a
separator sets options for the slide that follows:

```md
---
layout: two-cols
---

# Slide title
```

This deck uses the `seriph` theme and four layouts: `cover` (title slide),
`section` (unit dividers), `two-cols`, and the default. See the
[Slidev syntax guide](https://sli.dev/guide/syntax) and the
[built-in layouts](https://sli.dev/builtin/layouts) for the rest.

Speaker notes go in an HTML comment as the **last** thing in a slide:

```md
<!-- Mention that the kernel stays resident for the whole session. -->
```

They appear in presenter view only.
