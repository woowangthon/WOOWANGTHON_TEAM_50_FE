import assert from 'node:assert/strict'
import { test } from 'node:test'
import { interestScores } from '../src/lib/interestTypes.js'
import { readableBlocks } from '../src/lib/readableText.js'

test('radar always has six ordered interest axes, ignoring other traits and containing invalid scores', () => {
  const scores = interestScores([
    { code: 'autonomy', score: 1 },
    { code: 'I', score: 0.75 },
    { code: 'R', score: -0.2 },
    { code: 'A', score: 1.2 },
    { code: 'S', score: Number.NaN },
    { code: 'E', score: Number.POSITIVE_INFINITY },
  ])
  assert.deepEqual(scores.map(({ code }) => code), ['R', 'I', 'A', 'S', 'E', 'C'])
  assert.deepEqual(scores.map(({ score }) => score), [0, 0.75, 1, 0, 0, 0])
})

test('AI response formatting preserves explicit paragraphs and handles absent content', () => {
  assert.deepEqual(readableBlocks(null), [])
  assert.deepEqual(readableBlocks('첫 번째 이야기예요.\r\n\r\n다음 이야기예요.'), [
    { kind: 'paragraph', text: '첫 번째 이야기예요.' },
    { kind: 'paragraph', text: '다음 이야기예요.' },
  ])
})

test('long AI replies gain paragraph breaks without losing any sentence', () => {
  const sentences = [
    '내가 좋아하는 활동을 찾으려면 결과보다 그 활동을 하는 동안 어떤 기분이었는지 먼저 돌아보면 좋아요.',
    '과학 실험의 원리가 궁금해서 스스로 자료를 찾아본 경험이 있다면 탐구하는 일에 관심이 있을 수 있어요.',
    '사람을 돕거나 설명하면서 보람을 느꼈다면 그런 활동도 함께 살펴볼 수 있어요.',
    '아직 하나의 직업을 정하지 않아도 괜찮고 다양한 활동을 해 보며 마음이 가는 쪽을 알아가면 돼요.',
  ]
  const blocks = readableBlocks(sentences.join(' '))
  assert.ok(blocks.length > 1)
  assert.equal(blocks.map(({ text }) => text).join(' '), sentences.join(' '))
})

test('a short three-sentence answer also has a paragraph break', () => {
  assert.deepEqual(readableBlocks('좋아하는 일을 찾아봐요. 작게 시도해 봐도 좋아요. 천천히 알아가면 돼요.'), [
    { kind: 'paragraph', text: '좋아하는 일을 찾아봐요. 작게 시도해 봐도 좋아요.' },
    { kind: 'paragraph', text: '천천히 알아가면 돼요.' },
  ])
})

test('AI response formatting distinguishes headings, numbered steps, and bullet points', () => {
  const blocks = readableBlocks('## 작은 실천\n3. 관심 있는 활동 고르기\n4. 친구와 해 보기\n\n- 느낌 기록하기\n- 다음 활동 정하기')
  assert.deepEqual(blocks, [
    { kind: 'heading', text: '작은 실천' },
    { kind: 'ol', items: ['관심 있는 활동 고르기', '친구와 해 보기'], start: 3 },
    { kind: 'ul', items: ['느낌 기록하기', '다음 활동 정하기'], start: undefined },
  ])
})
