import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { packageRoot, resolveSelector, matchesSelector } from '../../src/lectures.mjs'
import {
  discoverCourses,
  findCourseRoot,
  parseCourseId,
  courseCodeLabel,
  readCourse,
  selectCourses
} from '../../src/courses.mjs'

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')
const COURSES = path.join(fixtures, 'courses')
const AMBIGUOUS = path.join(fixtures, 'ambiguous-courses')
const INTRO = path.join(COURSES, 'csc-118-intro-to-linux')

test('parseCourseId splits a course code from its slug', () => {
  assert.deepEqual(parseCourseId('csc-118-intro-to-linux'), {
    code: 'csc-118',
    slug: 'intro-to-linux'
  })
})

test('parseCourseId keeps a name that carries no code whole', () => {
  assert.deepEqual(parseCourseId('workshop'), { code: null, slug: 'workshop' })
})

test('discovery skips a directory without a course.json', async () => {
  const courses = await discoverCourses(COURSES)
  assert.deepEqual(
    courses.map((c) => c.id),
    ['csc-118-intro-to-linux', 'csc-171-linux-administration', 'workshop']
  )
})

test('discovery reads the title from course.json', async () => {
  const courses = await discoverCourses(COURSES)
  assert.equal(courses[0].title, 'CSC 118 — Introduction to Linux')
})

test('a course carries the paths a build resolves against', async () => {
  const course = await readCourse(INTRO)
  assert.equal(course.lecturesDir, path.join(INTRO, 'lectures'))
  assert.equal(course.distDir, path.join(INTRO, 'dist'))
  assert.equal(course.base, './')
})

test('base falls back to a relative path when course.json omits it', async () => {
  const course = await readCourse(path.join(COURSES, 'workshop'))
  assert.equal(course.base, './')
})

test('reading a directory that is not a course returns null', async () => {
  assert.equal(await readCourse(path.join(COURSES, 'not-a-course')), null)
})

test('discovery returns an empty list for a missing courses directory', async () => {
  assert.deepEqual(await discoverCourses(path.join(fixtures, 'does-not-exist')), [])
})

test('a course selector resolves by code, slug, or full directory name', async () => {
  const courses = await discoverCourses(COURSES)
  for (const selector of ['csc-118', 'csc118', 'intro-to-linux', 'csc-118-intro-to-linux']) {
    assert.equal(resolveSelector(courses, selector, 'course').id, 'csc-118-intro-to-linux', selector)
  }
})

test('a course whose name carries no code still matches by id', async () => {
  const courses = await discoverCourses(COURSES)
  assert.equal(resolveSelector(courses, 'workshop', 'course').id, 'workshop')
})

test('course selector matching is exact, not substring', async () => {
  const courses = await discoverCourses(COURSES)
  const intro = courses.find((c) => c.id === 'csc-118-intro-to-linux')

  assert.equal(matchesSelector(intro, 'csc', 'course'), false)
  assert.equal(matchesSelector(intro, 'intro', 'course'), false)
  assert.equal(matchesSelector(intro, '118', 'course'), false)
})

test('an unknown course selector errors and lists the available courses', async () => {
  const courses = await discoverCourses(COURSES)
  assert.throws(
    () => resolveSelector(courses, 'csc-999', 'course'),
    (error) => {
      assert.match(error.message, /No course matches "csc-999"/)
      assert.match(error.message, /Available courses/)
      assert.match(error.message, /csc-171-linux-administration/)
      return true
    }
  )
})

test('an ambiguous course selector errors naming the candidates', async () => {
  const courses = await discoverCourses(AMBIGUOUS)
  assert.throws(
    () => resolveSelector(courses, 'csc118', 'course'),
    (error) => {
      assert.match(error.message, /ambiguous/)
      assert.match(error.message, /csc-118-intro-to-linux, csc-118-linux-basics/)
      return true
    }
  )
})

test('the course root is found by walking up from a nested directory', () => {
  assert.equal(findCourseRoot(path.join(INTRO, 'lectures', '01-intro')), INTRO)
  assert.equal(findCourseRoot(INTRO), INTRO)
})

test('there is no course root above every course', () => {
  assert.equal(findCourseRoot(COURSES), null)
})

test('a cwd inside a course selects that course, without --course', async () => {
  const [course] = await selectCourses(COURSES, null, path.join(INTRO, 'lectures', '01-intro'))
  assert.equal(course.id, 'csc-118-intro-to-linux')
})

test('--course wins over the cwd, so one course builds from inside another', async () => {
  const [course] = await selectCourses(COURSES, 'csc-171', path.join(INTRO, 'lectures'))
  assert.equal(course.id, 'csc-171-linux-administration')
})

test('above every course, a bare invocation means all of them', async () => {
  const courses = await selectCourses(COURSES, null, COURSES)
  assert.equal(courses.length, 3)
})

test('the kit finds its own assets from a cwd inside a course', async (t) => {
  const cwd = process.cwd()
  process.chdir(path.join(INTRO, 'lectures', '01-intro'))
  t.after(() => process.chdir(cwd))

  for (const asset of [
    ['assets', 'notes', 'template.html'],
    ['assets', 'notes', 'notes.css'],
    ['templates', 'lecture', 'slides.md']
  ]) {
    assert.ok(existsSync(path.join(packageRoot, ...asset)), asset.join('/'))
  }
})

test('a course code reads as it is written in prose', () => {
  assert.equal(courseCodeLabel({ code: 'csc-118', id: 'x', title: 'X' }), 'CSC 118')
  assert.equal(courseCodeLabel({ code: null, id: 'workshop', title: 'Weekend Workshop' }),
    'Weekend Workshop')
})
