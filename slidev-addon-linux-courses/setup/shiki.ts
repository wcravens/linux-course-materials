// Give the decks the same WCAG AA code colors the prose documents get.
//
// Slidev resolves `setup/` files from theme roots and addon roots as well as
// from the deck itself (`loadSetups` in the CLI, over `[themeRoots, addonRoots,
// userRoot]`), so one file here reaches every lecture in every course. The
// `transformers` it returns are handed straight to `@shikijs/markdown-it`.
//
// Plain JavaScript in a `.ts` file on purpose: the filename is what Slidev
// looks for, and the module has nothing to gain from type annotations. It is
// loaded through jiti, which resolves bare specifiers the usual way — hence
// the workspace `course-kit` dependency in this package's manifest.

import { contrastTransformer } from 'course-kit/src/contrast.mjs'

// Slidev's `--slidev-code-background` for the light theme, from
// `@slidev/client/styles/vars.css`. The decks do not override it. Shiki's own
// `--shiki-light-bg` is rewritten to match, so the two cannot disagree.
const CODE_BACKGROUND = '#f5f5f5'

export default () => ({
  // Slidev's own defaults, restated because naming `transformers` here
  // replaces nothing else: the merge is a plain `Object.assign` over every
  // setup's return value.
  themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
  transformers: [contrastTransformer(CODE_BACKGROUND)]
})
