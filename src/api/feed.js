import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 응답: { cards: [{ impression_id, source, card_id, type, title, body, job_id, job_name, majors[], options[], saved, reason }] }
// - majors: 직업 카드의 관련 학과. 선택형 카드이거나 정보가 없으면 []
// - job_id: 직업 카드면 GET /jobs/{job_id}로 상세를 볼 수 있습니다. 선택형 카드는 null
// - saved: 이미 저장한 카드인지 여부
// - reason: '왜 이 카드?' 한 줄. 맞춤(personalized)·무작위(random) 카드만 있고, 그 밖에는 null
// cards가 비어 있으면 더 보여 줄 카드가 없습니다. 화면에서는 하루 장수(5)만큼만 요청합니다.
export function getFeed(n = 10) {
  return USE_MOCK ? mock.getFeed(n) : apiFetch(`/feed?n=${n}`)
}

// 화면에서 쓰는 reaction: 'like' | 'dislike' | 'choose' (choose일 때만 option_id)
// 넘기기(pass)는 쓰지 않고, 저장(save)은 반응이 아니라 saveCard()로 따로 보냅니다. (save를 보내면 422)
// 응답: { status: 'recorded' | 'duplicate', gains[], today_count, daily_goal, streak, goal_reached }
// - gains: 이번 반응으로 많이 오른 성향 최대 2개 [{ code, label, delta(퍼센트 포인트) }]. duplicate면 []
// - goal_reached: 이번 반응으로 오늘 목표를 막 채웠으면 true
export function postReaction({ impressionId, reaction, optionId = null }) {
  const body = { impression_id: impressionId, reaction, option_id: optionId }
  return USE_MOCK ? mock.postReaction(body) : apiFetch('/reactions', { method: 'POST', body })
}
