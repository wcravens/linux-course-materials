import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverModules, readModule, MODULES_DIRNAME } from '../../src/modules.mjs'

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const MODULES = path.join(fixtures, 'modules')

test('modules live in a directory named for the collection', () => {
  assert.equal(MODULES_DIRNAME, 'modules')
})

test('discovery finds module directories sorted by name', async () => {
  const modules = await discoverModules(MODULES)
  assert.deepEqual(
    modules.map((m) => m.id),
    ['gcp-vm', 'markdown', 'no-tutorial', 'scaffolded', 'shell-basics']
  )
})

test('discovery reads titles from tutorial.md frontmatter', async () => {
  const modules = await discoverModules(MODULES)
  const markdown = modules.find((m) => m.id === 'markdown')
  assert.equal(markdown.title, 'Writing Markdown')
})

test('a module declares its kind and carries no number', async () => {
  const modules = await discoverModules(MODULES)
  assert.ok(modules.every((m) => m.kind === 'module'))
  assert.ok(modules.every((m) => m.number === null))
})

test('a module slug is its id, since module names carry no numeric prefix', async () => {
  const modules = await discoverModules(MODULES)
  assert.ok(modules.every((m) => m.slug === m.id))
})

test('a directory without tutorial.md is reported, not silently skipped', async () => {
  const modules = await discoverModules(MODULES)
  const broken = modules.find((m) => m.id === 'no-tutorial')

  assert.ok(broken, 'the directory should still appear in the discovered list')
  assert.equal(broken.hasTutorial, false)
  assert.equal(broken.tutorialPath, null)
  assert.equal(broken.title, null)
})

test('a module is prose-first: slides are optional', async () => {
  const modules = await discoverModules(MODULES)
  const markdown = modules.find((m) => m.id === 'markdown')
  const gcp = modules.find((m) => m.id === 'gcp-vm')

  assert.equal(markdown.hasSlides, false)
  assert.equal(gcp.hasSlides, true)
  assert.ok(gcp.slidesPath.endsWith(path.join('gcp-vm', 'slides.md')))
})

test('optional artifacts are detected per module', async () => {
  const modules = await discoverModules(MODULES)
  const markdown = modules.find((m) => m.id === 'markdown')
  const gcp = modules.find((m) => m.id === 'gcp-vm')

  assert.ok(markdown.tutorialPath.endsWith('tutorial.md'))
  assert.equal(markdown.abstractPath, null)
  assert.equal(markdown.notesPath, null)
  assert.equal(markdown.labPath, null)
  assert.equal(markdown.codeDir, null)
  assert.equal(markdown.publicDir, null)

  assert.ok(gcp.abstractPath.endsWith('abstract.md'))
  assert.ok(gcp.codeDir.endsWith('code'))
  assert.ok(gcp.publicDir.endsWith('public'))
})

test('a code directory holding only a .gitkeep does not count as content', async () => {
  const modules = await discoverModules(MODULES)
  const scaffolded = modules.find((m) => m.id === 'scaffolded')
  assert.equal(scaffolded.codeDir, null)
})

test('discovery returns an empty list for a missing modules directory', async () => {
  assert.deepEqual(await discoverModules(path.join(fixtures, 'does-not-exist')), [])
})

test('reading one module by id gives the same descriptor discovery does', async () => {
  const [fromDiscovery] = (await discoverModules(MODULES)).filter((m) => m.id === 'markdown')
  const direct = await readModule(MODULES, 'markdown')
  assert.deepEqual(direct, fromDiscovery)
})
