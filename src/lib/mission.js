import { readJSON, writeJSON } from './storage.js'

// 오늘의 미션 완료 여부는 서버가 저장하지 않아서 브라우저에 계정별로 기억합니다.
// 미션 id에 날짜가 들어 있으므로 마지막으로 완료한 id 하나만 두면 날짜가 바뀔 때 자연스럽게 초기화됩니다.
const missionKey = (userId) => `findme-mission-done:${userId}`

export function getDoneMissionId(userId) {
  if (!userId) return null
  const value = readJSON(missionKey(userId), null)
  return typeof value === 'string' ? value : null
}

// missionId가 null이면 완료 표시를 지웁니다.
export function setDoneMissionId(userId, missionId) {
  if (!userId) return
  writeJSON(missionKey(userId), missionId)
}
