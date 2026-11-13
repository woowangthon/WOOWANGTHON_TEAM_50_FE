import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 설문을 이미 했는지. 다른 브라우저·기기에서 로그인해도 설문을 다시 띄우지 않기 위해 씁니다.
// 응답: { done, version, answers, created_at } (안 했으면 done=false, 나머지 null)
export function getInterestSurveyStatus() {
  return USE_MOCK ? mock.getInterestSurveyStatus() : apiFetch('/interest-survey')
}

// 관심사 설문 12문항 답을 서버에 보내 흥미 점수에 반영합니다. 사용자당 한 번만 반영됩니다.
// body: { version, answers: { 문항 ID: strongly_dislike | dislike | neutral | like | strongly_like } }
// 응답: { status: 'recorded' | 'duplicate' } — duplicate도 이미 반영된 것이므로 성공으로 봅니다.
export function submitInterestSurvey(body) {
  return USE_MOCK ? mock.submitInterestSurvey(body) : apiFetch('/interest-survey', { method: 'POST', body })
}
