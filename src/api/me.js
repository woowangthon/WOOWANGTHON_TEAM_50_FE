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

// 저장한 카드, 최근 순. 응답: { cards: [{ ...카드 필드, saved_at }] }
export function getSaved() {
  return USE_MOCK ? mock.getSaved() : apiFetch('/me/saved')
}

// 저장은 반응(끌려요·별로예요)과 별개인 북마크입니다. 저장해도 카드는 넘어가지 않고 성향에도 반영되지 않습니다.
// ※ 백엔드에 요청한 API입니다 (PUT·DELETE /me/saved/{card_id}). 백엔드 반영 전에는 목업에서만 동작합니다.
export function saveCard(cardId) {
  return USE_MOCK ? mock.saveCard(cardId) : apiFetch(`/me/saved/${encodeURIComponent(cardId)}`, { method: 'PUT' })
}

export function unsaveCard(cardId) {
  return USE_MOCK ? mock.unsaveCard(cardId) : apiFetch(`/me/saved/${encodeURIComponent(cardId)}`, { method: 'DELETE' })
}

// 성향 리포트. 끌려요를 1번 이상 누르면 ready=true가 됩니다. (최소 개수 없음, 백엔드 변경 요청 중)
// ready=true면 summary, jobs는 항상 있습니다. summary_by_ai=true면 Gemini가 쓴 문장입니다.
export function getReport() {
  return USE_MOCK ? mock.getReport() : apiFetch('/me/report')
}

// 저장한 직업 카드마다 로드맵, 최근 저장 순. 응답: { jobs: [RoadmapJob] } (저장한 직업이 없으면 [])
export function getRoadmaps() {
  return USE_MOCK ? mock.getRoadmaps() : apiFetch('/me/roadmap')
}

// 직업 하나의 로드맵. 저장하지 않은 직업도 볼 수 있습니다. (저장했다면 saved_at이 채워짐)
// RoadmapJob: { job_id, name, field, summary, majors[], card_id, saved_at, traits[], steps[] }
// 없는 직업이면 ApiError(404, 'job_not_found')
export function getRoadmap(jobId) {
  return USE_MOCK ? mock.getRoadmap(jobId) : apiFetch(`/me/roadmap/${encodeURIComponent(jobId)}`)
}
