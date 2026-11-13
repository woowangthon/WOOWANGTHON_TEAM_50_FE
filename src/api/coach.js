import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// AI 진로 동료. 순위·적합도는 서버 코드가 계산하고, Gemini는 그 결과와 커리어넷 자료를 말로 풀어 주기만 합니다.
// Gemini가 실패하거나 키가 없으면 기록·자료만으로 만든 답을 줍니다 (by_ai: false).

// 직업에 대한 정해진 질문에 답합니다. 자유 입력은 없습니다.
// questionId: GET /jobs/{job_id}의 questions[].id ('why_match' | 'day' | 'hard' | 'start')
// 응답: { answer, by_ai }
// 오류: 404 'job_not_found', 422 'no_match_yet' (성향이 아직 없는데 why_match를 물을 때)
export function askJob(jobId, questionId) {
  const body = { question_id: questionId }
  return USE_MOCK
    ? mock.askJob(jobId, body)
    : apiFetch(`/jobs/${encodeURIComponent(jobId)}/ask`, { method: 'POST', body })
}

// 대화. 서버는 대화를 저장하지 않으므로 최근 대화를 함께 보냅니다.
// messages: [{ role: 'user' | 'ai', text }] 1~20개, 각 1~500자, 마지막은 학생 말(300자 이내)
// 응답: { reply, suggestions: [이어서 누를 말 최대 3개], by_ai }
// 위기 표현에는 상담 전화 안내가 정해진 문구로 옵니다 (suggestions는 빈 목록).
// 오류: 422 'invalid_message', 429 'chat_limit' (하루 30회)
export function sendChat(messages) {
  const body = { messages }
  return USE_MOCK ? mock.sendChat(body) : apiFetch('/chat', { method: 'POST', body })
}
