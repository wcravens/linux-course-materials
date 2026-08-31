import test from 'node:test'
import assert from 'node:assert/strict'
import { extractCourseFlag, extractModuleFlag } from '../../src/course.mjs'

test('the course flag is pulled out wherever it appears', () => {
  assert.deepEqual(extractCourseFlag(['01', '-c', 'csc-118', '02']),
    { course: 'csc-118', args: ['01', '02'] })
  assert.deepEqual(extractCourseFlag(['--course=csc-171', '01']),
    { course: 'csc-171', args: ['01'] })
  assert.deepEqual(extractCourseFlag(['01']), { course: null, args: ['01'] })
})

test('the module flag is a bare switch, leaving the slug and title behind', () => {
  assert.deepEqual(extractModuleFlag(['--module', 'markdown', 'Writing Markdown']),
    { isModule: true, args: ['markdown', 'Writing Markdown'] })
  assert.deepEqual(extractModuleFlag(['-m', 'markdown', 'Writing Markdown']),
    { isModule: true, args: ['markdown', 'Writing Markdown'] })
  assert.deepEqual(extractModuleFlag(['01', 'A Lecture']),
    { isModule: false, args: ['01', 'A Lecture'] })
})
