import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 응답: { cards: [{ impression_id, source, card_id, type, title, body, job_name, options[] }] }
// cards가 비어 있으면 더 보여 줄 카드가 없습니다.
export function getFeed(n = 10) {
  return USE_MOCK ? mock.getFeed(n) : apiFetch(`/feed?n=${n}`)
}

// reaction: 'like' | 'dislike' | 'save' | 'pass' | 'choose' (choose일 때만 option_id)
// 응답: { status: 'recorded' | 'duplicate' }
export function postReaction({ impressionId, reaction, optionId = null }) {
  const body = { impression_id: impressionId, reaction, option_id: optionId }
  return USE_MOCK ? mock.postReaction(body) : apiFetch('/reactions', { method: 'POST', body })
}
