import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 응답: { cards: [{ impression_id, source, card_id, type, title, body, job_name, majors[], options[] }] }
// majors는 직업 카드의 관련 학과입니다. 선택형 카드이거나 정보가 없으면 [] 입니다.
// saved는 이미 저장한 카드인지 여부입니다. (백엔드 추가 요청 중, 없으면 false로 봅니다)
// cards가 비어 있으면 더 보여 줄 카드가 없습니다.
export function getFeed(n = 10) {
  return USE_MOCK ? mock.getFeed(n) : apiFetch(`/feed?n=${n}`)
}

// 화면에서 쓰는 reaction: 'like' | 'dislike' | 'choose' (choose일 때만 option_id)
// 넘기기(pass)는 쓰지 않고, 저장(save)은 반응이 아니라 saveCard()로 따로 보냅니다.
// 응답: { status: 'recorded' | 'duplicate' }
export function postReaction({ impressionId, reaction, optionId = null }) {
  const body = { impression_id: impressionId, reaction, option_id: optionId }
  return USE_MOCK ? mock.postReaction(body) : apiFetch('/reactions', { method: 'POST', body })
}
