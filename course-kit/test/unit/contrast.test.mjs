// The transformer has to cope with both shapes Shiki emits.
//
// Asking for one theme gets a plain `color:` declaration, which is what the
// prose renderer sees. Asking for a light/dark pair — what Slidev does — gets
// custom properties instead, and no `color:` at all. A transformer written for
// the first shape is a silent no-op on the second, which is how the exported
// slide PDFs shipped 2.1:1 comment gray while the prose HTML passed.

import test from 'node:test'
import assert from 'node:assert/strict'
import { contrastRatio, readableColor, contrastTransformer } from '../../src/contrast.mjs'

// Slidev's `--slidev-code-background` in its light theme.
const SLIDE_CODE_BG = '#f5f5f5'
const AA = 4.5

/** Run the transformer over one hast-shaped node and hand back its style. */
function transform (style, background = SLIDE_CODE_BG) {
  const node = { properties: { style }, children: [] }
  contrastTransformer(background).root(node)
  return node.properties.style
}

/** Every `--shiki-light` color in a style string. */
const lightColors = (style) =>
  [...style.matchAll(/--shiki-light:(#[0-9a-f]{3,8})/gi)].map((m) => m[1])

test('a Slidev-shaped style has its light color darkened and its dark color left alone', () => {
  // Verbatim from a built deck: vitesse-light's comment gray beside its
  // vitesse-dark counterpart.
  const out = transform('--shiki-dark:#758575DD;--shiki-light:#A0ADA0')

  assert.match(out, /--shiki-dark:#758575DD/, 'the dark theme is drawn on a background we know nothing about')
  const [light] = lightColors(out)
  assert.notEqual(light, '#A0ADA0')
  assert.ok(contrastRatio(light, SLIDE_CODE_BG) >= AA, `${light} still fails AA`)
})

test('a prose-shaped style keeps working', () => {
  const out = transform('color:#A0ADA0;--shiki-dark:#758575DD', '#f5f4ef')
  const color = /(?:^|;)color:(#[0-9a-f]{3,8})/i.exec(out)[1]
  assert.ok(contrastRatio(color, '#f5f4ef') >= AA)
  assert.match(out, /--shiki-dark:#758575DD/)
})

test('the theme background is replaced with the one the code is actually drawn on', () => {
  // Shiki writes the theme's own background inline, where it outranks the CSS.
  const out = transform('--shiki-light-bg:#ffffff;--shiki-dark-bg:#121212')
  assert.match(out, /--shiki-light-bg:#f5f5f5/)
  assert.match(out, /--shiki-dark-bg:#121212/)

  assert.match(transform('background-color:#ffffff'), /background-color:#f5f5f5/)
})

test('a property name is only matched at the start of a declaration', () => {
  // `color` sits inside `background-color`, and `--shiki-light` inside
  // `--shiki-light-bg`. Neither may be rewritten as a foreground.
  const out = transform('--shiki-light-bg:#ffffff;background-color:#ffffff')
  assert.equal(lightColors(out).length, 0, 'no foreground was invented')
  assert.match(out, /--shiki-light-bg:#f5f5f5/)
  assert.match(out, /background-color:#f5f5f5/)
})

test('every failing vitesse-light token color is brought up to AA on the slide background', () => {
  // The colors measured in the exported PDFs, worst first.
  const failing = ['#B5695977', '#A0ADA0', '#999999', '#b07d48', '#998418', '#B56959', '#59873a', '#ab5959']
  for (const color of failing) {
    assert.ok(contrastRatio(color, SLIDE_CODE_BG) < AA, `${color} was supposed to be a failing color`)
    const fixed = readableColor(color, SLIDE_CODE_BG)
    assert.ok(contrastRatio(fixed, SLIDE_CODE_BG) >= AA, `${color} -> ${fixed} still fails AA`)
  }
})

test('a color that already passes is left exactly as it was', () => {
  const out = transform('--shiki-dark:#dbd7caee;--shiki-light:#393a34')
  assert.match(out, /--shiki-light:#393a34/)
})

// The hook itself, not just the machinery behind it.
//
// A build succeeds whether or not Slidev finds `setup/shiki.ts`, and the only
// symptom of it going unfound is that the decks quietly ship vitesse-light's
// raw palette again. Nothing else in the suite would notice, so assert on the
// addon's actual export — the same module Slidev loads.
test('the addon Slidev hook returns a transformer that fixes the palette', async () => {
  const hook = await import('../../../slidev-addon-linux-courses/setup/shiki.ts')
  const options = hook.default()

  assert.deepEqual(options.themes, { light: 'vitesse-light', dark: 'vitesse-dark' },
    'the hook must restate the themes it is merged over')
  assert.equal(options.transformers?.length, 1)

  const [transformer] = options.transformers
  const node = { properties: { style: '--shiki-dark:#758575DD;--shiki-light:#A0ADA0' }, children: [] }
  transformer.root(node)

  const [light] = lightColors(node.properties.style)
  assert.ok(contrastRatio(light, SLIDE_CODE_BG) >= AA,
    `the hook left ${light}, which is ${contrastRatio(light, SLIDE_CODE_BG)?.toFixed(2)}:1`)
})
