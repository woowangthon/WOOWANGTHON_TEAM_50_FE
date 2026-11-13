import { readJSON, writeJSON } from './storage.js'

// AI 진로 동료와 나눈 대화 목록. 서버는 대화를 저장하지 않으므로 이 브라우저에 계정별로 보관합니다.
// 대화: { id, title, pinned, createdAt, updatedAt, messages: [{ id, role: 'user' | 'ai', text, byAi?, suggestions? }] }
const chatKey = (userId) => `findme-chats:${userId}`
const MAX_CHATS = 50 // 고정하지 않은 대화는 최근 것부터 이만큼만 남깁니다.
const MAX_MESSAGES = 100 // 대화 하나에 남길 메시지 수
const TITLE_LENGTH = 28

// 서버에 보내는 대화 규칙 (POST /chat): 최근 20개, 각 500자 이내, 학생 말은 300자 이내
export const MAX_SEND_MESSAGES = 20
export const MAX_USER_CHARS = 300
const MAX_TEXT = 500

// 백엔드 app/llm/coach.py STARTERS와 같은 문구. 새 대화를 시작할 때 고를 수 있게 보여 줍니다.
export const CHAT_STARTERS = ['내 성향을 쉽게 설명해 줘', '나한테 맞는 직업이 궁금해', '아직 꿈이 없어도 괜찮을까?', '오늘 뭘 해 보면 좋을까?']

export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function chatTitle(text) {
  const clean = text.split(/\s+/).join(' ').trim()
  return clean.length > TITLE_LENGTH ? `${clean.slice(0, TITLE_LENGTH)}…` : clean
}

function isChat(value) {
  return value && typeof value.id === 'string' && typeof value.title === 'string' && Array.isArray(value.messages)
}

// 고정한 대화가 먼저, 그다음 최근에 이야기한 순서입니다.
export function sortChats(chats) {
  return [...chats].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
}

export function loadChats(userId) {
  if (!userId) return []
  const list = readJSON(chatKey(userId), [])
  return Array.isArray(list) ? sortChats(list.filter(isChat)) : []
}

export function saveChats(userId, chats) {
  if (!userId) return chats
  const sorted = sortChats(chats).map((chat) => ({ ...chat, messages: chat.messages.slice(-MAX_MESSAGES) }))
  let unpinned = 0
  const kept = sorted.filter((chat) => chat.pinned || (unpinned += 1) <= MAX_CHATS)
  writeJSON(chatKey(userId), kept)
  return kept
}

// 서버에 보낼 최근 대화. 마지막은 학생 말이어야 합니다.
export function toChatPayload(messages) {
  return messages
    .slice(-MAX_SEND_MESSAGES)
    .map(({ role, text }) => ({ role, text: text.slice(0, MAX_TEXT) }))
}
