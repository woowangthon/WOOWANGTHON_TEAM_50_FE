import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 관심사 설문 12문항 답을 서버에 보내 흥미 점수에 반영합니다. 사용자당 한 번만 반영됩니다.
// body: { version, answers: { 문항 ID: strongly_dislike | dislike | neutral | like | strongly_like } }
// 응답: { status: 'recorded' | 'duplicate' } — duplicate도 이미 반영된 것이므로 성공으로 봅니다.
export function submitInterestSurvey(body) {
  return USE_MOCK ? mock.submitInterestSurvey(body) : apiFetch('/interest-survey', { method: 'POST', body })
}
