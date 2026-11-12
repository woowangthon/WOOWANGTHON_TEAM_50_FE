import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 응답: { user_id, email, nickname, grade, created_at, updated_at, n_reactions, traits[] }
// 프로필이 없으면 ApiError(404, 'profile_not_found')
export function getMe() {
  return USE_MOCK ? mock.getMe() : apiFetch('/me')
}

// body: { nickname: 1~20자, grade: 1~3 | null }
export function createMe(body) {
  return USE_MOCK ? mock.createMe(body) : apiFetch('/me', { method: 'POST', body })
}

// 보낸 필드만 수정됩니다. grade는 null로 지울 수 있습니다.
export function updateMe(body) {
  return USE_MOCK ? mock.updateMe(body) : apiFetch('/me', { method: 'PATCH', body })
}

// 저장한 카드, 최근 순. 응답: { cards: [{ ...카드 필드(job_id 포함), saved_at }] }
export function getSaved() {
  return USE_MOCK ? mock.getSaved() : apiFetch('/me/saved')
}

// 저장은 반응(끌려요·별로예요)과 별개인 북마크입니다. 저장해도 카드는 넘어가지 않고 성향에도 반영되지 않습니다.
// 둘 다 204(응답 본문 없음). 이미 저장했거나 저장하지 않은 카드여도 204이고, 없는 카드를 저장하면 404 'card_not_found'
export function saveCard(cardId) {
  return USE_MOCK ? mock.saveCard(cardId) : apiFetch(`/me/saved/${encodeURIComponent(cardId)}`, { method: 'PUT' })
}

export function unsaveCard(cardId) {
  return USE_MOCK ? mock.unsaveCard(cardId) : apiFetch(`/me/saved/${encodeURIComponent(cardId)}`, { method: 'DELETE' })
}

// 성향 리포트. 끌려요나 선택형 답이 1개 이상이면 ready=true입니다. (저장은 세지 않음)
// ready=true면 summary, jobs는 항상 있습니다. summary_by_ai=true면 Gemini가 쓴 문장입니다.
// jobs[].match는 적합도 0~100입니다. 화면에는 score 대신 이 값을 씁니다.
export function getReport() {
  return USE_MOCK ? mock.getReport() : apiFetch('/me/report')
}

// 홈 화면용 여정.
// 응답: { streak, today_count, daily_goal, n_reactions, level, persona, report_ready, report_remaining, mission, badges[] }
// - streak: 연속 접속 일수 (한국 시간). 오늘 아직 안 했어도 어제까지 이어졌으면 유지됩니다.
// - daily_goal: 하루 카드 수(지금 5). 백엔드는 목표로만 두지만, 화면에서는 하루 상한으로 써서 today_count가 이만큼 차면 오늘의 카드를 닫습니다.
// - level: { n, name, next_at(최고 레벨이면 null), progress(현재 레벨 안에서 0~1) }
// - persona: { code: 'IA', name, tagline, labels[] } | null (흥미 성향이 아직 없으면 null)
// - mission: { id, text, trait } id에 날짜가 들어 있어 매일 바뀝니다. 완료 여부는 프론트가 id로 기억합니다.
// - badges: [{ id, name, description, earned }]
export function getJourney() {
  return USE_MOCK ? mock.getJourney() : apiFetch('/me/journey')
}
