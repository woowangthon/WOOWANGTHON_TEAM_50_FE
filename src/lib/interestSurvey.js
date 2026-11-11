import { readJSON } from './storage.js'

export const SURVEY_VERSION = 1

// 답변은 점수로 계산하지 않고 선택한 값 그대로 보관합니다.
export const INTEREST_OPTIONS = [
  { value: 'strongly_dislike', label: '전혀 하고 싶지 않아요' },
  { value: 'dislike', label: '별로 하고 싶지 않아요' },
  { value: 'neutral', label: '보통이에요' },
  { value: 'like', label: '조금 해보고 싶어요' },
  { value: 'strongly_like', label: '정말 해보고 싶어요' },
]

// ID는 문구를 바꾸어도 유지합니다. 질문 구성이나 선택지가 바뀌면 버전을 올립니다.
export const INTEREST_QUESTIONS = [
  { id: 'make', interest: 'R', text: '내가 쓸 물건을 직접 만들어 보고 싶나요?' },
  { id: 'repair', interest: 'R', text: '고장 난 물건을 살펴보고 고쳐 보고 싶나요?' },
  { id: 'experiment', interest: 'I', text: '“이건 왜 그럴까?” 궁금한 걸 직접 실험해 보고 싶나요?' },
  { id: 'patterns', interest: 'I', text: '여러 자료를 살펴보면서 공통점이나 규칙을 찾아보고 싶나요?' },
  { id: 'stories', interest: 'A', text: '내가 상상한 이야기를 그림이나 영상으로 만들어 보고 싶나요?' },
  { id: 'design', interest: 'A', text: '같은 주제라도 나만의 스타일로 새롭게 꾸며 보고 싶나요?' },
  { id: 'explain', interest: 'S', text: '친구가 어려워하는 내용을 쉽게 설명해 주고 싶나요?' },
  { id: 'support', interest: 'S', text: '누군가의 고민을 듣고 함께 해결 방법을 찾아보고 싶나요?' },
  { id: 'invite', interest: 'E', text: '내 아이디어를 소개하고 “같이 해보자!”고 제안해 보고 싶나요?' },
  { id: 'coordinate', interest: 'E', text: '팀에서 무엇을 할지 친구들과 정하고 역할을 나눠 보고 싶나요?' },
  { id: 'organize', interest: 'C', text: '복잡한 내용을 표나 목록으로 깔끔하게 정리해 보고 싶나요?' },
  { id: 'checklist', interest: 'C', text: '행사 전에 준비물 목록을 보면서 빠진 게 없는지 확인해 보고 싶나요?' },
]

const values = new Set(INTEREST_OPTIONS.map(({ value }) => value))
const surveyKey = (userId) => `findme-interest-survey:${userId}`

export function cleanAnswers(answers) {
  return Object.fromEntries(INTEREST_QUESTIONS
    .filter(({ id }) => values.has(answers?.[id]))
    .map(({ id }) => [id, answers[id]]))
}

export function firstUnanswered(answers) {
  return INTEREST_QUESTIONS.find(({ id }) => !values.has(answers?.[id]))
}

export function getInterestSurvey(userId) {
  const saved = userId ? readJSON(surveyKey(userId), null) : null
  if (saved?.version !== SURVEY_VERSION) return { answers: {}, completed: false }
  const answers = cleanAnswers(saved.answers)
  const completed = typeof saved.completedAt === 'string'
    && Number.isFinite(Date.parse(saved.completedAt)) && !firstUnanswered(answers)
  return { answers, completed }
}

function writeSurvey(userId, answers, completedAt = null) {
  if (!userId) throw new Error('로그인 정보를 확인한 뒤 다시 시도해 주세요.')
  try {
    window.localStorage.setItem(surveyKey(userId), JSON.stringify({
      version: SURVEY_VERSION,
      answers: cleanAnswers(answers),
      completedAt,
    }))
  } catch {
    throw new Error('답변을 저장하지 못했어요. 브라우저의 사이트 저장 공간을 허용한 뒤 다시 시도해 주세요.')
  }
}

export function saveInterestDraft(userId, answers) {
  writeSurvey(userId, answers)
}

// 완료 여부는 이 브라우저에 기록합니다. 답변의 서버 반영은 InterestSurvey 화면에서 POST /interest-survey로 먼저 보냅니다.
export function completeInterestSurvey(userId, answers) {
  if (firstUnanswered(answers)) throw new Error('모든 질문에 답해주세요.')
  writeSurvey(userId, answers, new Date().toISOString())
}
