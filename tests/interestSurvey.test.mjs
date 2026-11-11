import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  INTEREST_QUESTIONS,
  SURVEY_VERSION,
  completeInterestSurvey,
  getInterestSurvey,
  saveInterestDraft,
} from '../src/lib/interestSurvey.js'

let storage
beforeEach(() => {
  storage = new Map()
  globalThis.window = { localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } }
})

const allAnswers = () => Object.fromEntries(INTEREST_QUESTIONS.map(({ id }) => [id, 'neutral']))

test('answers persist for their account; a draft does not complete onboarding', () => {
  saveInterestDraft('alice', { make: 'like', repair: 'neutral' })
  assert.deepEqual(getInterestSurvey('alice'), {
    answers: { make: 'like', repair: 'neutral' }, completed: false,
  })
  assert.deepEqual(getInterestSurvey('bob'), { answers: {}, completed: false })
  saveInterestDraft('alice', allAnswers())
  assert.equal(getInterestSurvey('alice').completed, false)
  completeInterestSurvey('alice', allAnswers())
  assert.equal(getInterestSurvey('alice').completed, true)
  assert.deepEqual(getInterestSurvey('alice').answers, allAnswers())
  assert.equal(getInterestSurvey('bob').completed, false)
})

test('an incomplete or unrecognized response cannot bypass onboarding', () => {
  const incomplete = allAnswers()
  delete incomplete.checklist
  assert.throws(() => completeInterestSurvey('alice', incomplete))
  const invalid = { ...allAnswers(), checklist: 'not-an-answer' }
  assert.throws(() => completeInterestSurvey('alice', invalid))
  storage.set('findme-interest-survey:alice', JSON.stringify({
    version: SURVEY_VERSION, answers: invalid, completedAt: new Date().toISOString(),
  }))
  assert.equal(getInterestSurvey('alice').completed, false)
  assert.equal(getInterestSurvey('alice').answers.checklist, undefined)
})

test('corrupt data, invalid timestamps, and old versions require a new survey', () => {
  storage.set('findme-interest-survey:alice', '{broken')
  assert.deepEqual(getInterestSurvey('alice'), { answers: {}, completed: false })
  for (const record of [
    { version: SURVEY_VERSION, answers: allAnswers(), completedAt: 'bad-date' },
    { version: 0, answers: allAnswers(), completedAt: new Date().toISOString() },
  ]) {
    storage.set('findme-interest-survey:alice', JSON.stringify(record))
    assert.equal(getInterestSurvey('alice').completed, false)
  }
})

test('storage failure is surfaced, without marking completion or losing a retry', () => {
  window.localStorage.setItem = () => { throw new Error('quota exceeded') }
  assert.throws(() => completeInterestSurvey('alice', allAnswers()), /저장하지 못했어요/)
  assert.equal(getInterestSurvey('alice').completed, false)
  window.localStorage.setItem = (key, value) => storage.set(key, value)
  completeInterestSurvey('alice', allAnswers())
  assert.equal(getInterestSurvey('alice').completed, true)
  assert.throws(() => completeInterestSurvey(null, allAnswers()), /로그인/)
})
