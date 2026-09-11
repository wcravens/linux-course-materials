// WCAG contrast arithmetic, and the Shiki transformer built on it.
//
// Shared by both output paths, which is the whole point of the file. The prose
// pipeline (`notes.mjs`) imports it directly; the slide pipeline reaches it
// through `slidev-addon-linux-courses/setup/shiki.ts`, because Slidev resolves
// `setup/` files from addon roots as well as from the deck. Before this module
// existed the fix lived inside `notes.mjs`, so prose passed an LMS
// accessibility check and the exported slide PDFs did not.

// WCAG AA for body-size text is 4.5:1. Code is set well below the 24px that
// would earn the large-text allowance of 3:1 in either output, so the stricter
// threshold is the one that applies. The extra tenth is headroom, so a checker
// that rounds differently than we do still agrees.
export const CONTRAST_TARGET = 4.6

/**
 * Split `#rgb`, `#rrggbb`, or `#rrggbbaa` into channels plus alpha.
 * Returns null for anything else, so callers can leave it untouched.
 */
function parseColor (value) {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(String(value).trim())?.[1]
  if (!hex) return null

  const expand = hex.length <= 4 ? (c) => c + c : (c) => c
  const pairs = hex.length <= 4 ? hex.split('') : hex.match(/../g)
  if (pairs.length < 3 || pairs.length > 4) return null

  const [r, g, b, a] = pairs.map((c) => parseInt(expand(c), 16))
  return { rgb: [r, g, b], alpha: a === undefined ? 1 : a / 255, hasAlpha: a !== undefined }
}

function formatColor ({ rgb, alpha, hasAlpha }) {
  const byte = (value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
  return '#' + rgb.map(byte).join('') + (hasAlpha ? byte(alpha * 255) : '')
}

function relativeLuminance ([r, g, b]) {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * WCAG contrast between a foreground and an opaque background. A translucent
 * foreground is composited onto the background first, which is what the
 * browser draws and what an accessibility checker measures.
 */
export function contrastRatio (foreground, background) {
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  if (!fg || !bg) return null

  const composited = fg.rgb.map((value, i) => value * fg.alpha + bg.rgb[i] * (1 - fg.alpha))
  const [light, dark] = [relativeLuminance(composited), relativeLuminance(bg.rgb)]
    .sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Darken `foreground` until it clears `target` against `background`, keeping
 * the hue by scaling all three channels together. Translucent colors are tried
 * at their own alpha first and only made opaque if that cannot reach the
 * target — a 47%-opaque color tops out around 2.9:1 on a light background.
 * Returns the color unchanged when it already passes.
 */
export function readableColor (foreground, background, target = CONTRAST_TARGET) {
  const fg = parseColor(foreground)
  if (!fg || !parseColor(background)) return foreground
  if (contrastRatio(foreground, background) >= target) return foreground

  for (const hasAlpha of fg.hasAlpha ? [true, false] : [false]) {
    for (let scale = 100; scale >= 0; scale -= 1) {
      const candidate = formatColor({
        rgb: fg.rgb.map((value) => (value * scale) / 100),
        alpha: fg.alpha,
        hasAlpha
      })
      if (contrastRatio(candidate, background) >= target) return candidate
    }
  }
  return '#000000'
}

// The two ways a Shiki token's color reaches the page. With a single default
// theme it is a plain `color:`, which is what the prose renderer gets. Slidev
// asks for a light/dark pair, and Shiki then writes *only* custom properties —
// `--shiki-light` and `--shiki-dark` — with the stylesheet choosing between
// them. A rule that knows about `color:` alone silently does nothing there,
// which is exactly how the slides kept shipping 2.1:1 comment gray.
//
// `(^|;)` anchors each name to the start of a declaration, so `color` cannot
// match inside `background-color` and `--shiki-light` cannot match inside
// `--shiki-light-bg`. The dark-theme properties are deliberately untouched:
// they are drawn on a dark background this module knows nothing about.
const FOREGROUND = /(^|;)(\s*)(color|--shiki-light):\s*(#[0-9a-f]{3,8})/gi
const BACKGROUND = /(^|;)(\s*)(background-color|--shiki-light-bg):\s*#[0-9a-f]{3,8}/gi

/**
 * Shiki themes are designed for a screen-lit editor, not for print or for an
 * LMS accessibility checker. Several of vitesse-light's token colors fail WCAG
 * AA — its comment gray sits at 2.1:1 on the slide code background — so rather
 * than abandon the theme (and the match between slides and prose), darken only
 * the colors that fail, in the rendered output where the exact colors Shiki
 * chose are visible.
 *
 * `background` is the color the code actually sits on, which differs between
 * the two pipelines: the prose stylesheet's `--code-bg`, and Slidev's
 * `--slidev-code-background`. Passing it in keeps this module from having to
 * know about either.
 */
export function contrastTransformer (background) {
  const readableStyle = (style) => style
    .replace(FOREGROUND, (_, sep, space, prop, color) =>
      `${sep}${space}${prop}:${readableColor(color, background)}`)
    .replace(BACKGROUND, (_, sep, space, prop) =>
      `${sep}${space}${prop}:${background}`)

  const walk = (node) => {
    if (typeof node.properties?.style === 'string') {
      node.properties.style = readableStyle(node.properties.style)
    }
    for (const child of node.children ?? []) walk(child)
  }

  return { name: 'course-kit:contrast', root: walk }
}
