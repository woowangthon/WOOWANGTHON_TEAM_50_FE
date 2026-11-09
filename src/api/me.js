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
