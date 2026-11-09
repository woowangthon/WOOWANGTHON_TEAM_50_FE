// 백엔드 없이 화면을 확인하기 위한 가짜 서버입니다.
// 응답 형식은 백엔드의 /me, /feed, /reactions와 같게 맞췄고, 데이터는 브라우저에만 저장됩니다.
import { makeError } from '../api/client.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { ATTRIBUTES, CARDS } from './data.js'

const SESSION_KEY = 'findme-mock-session'
const WEIGHTS = { save: 1.5, like: 1, choose: 1, pass: 0, dislike: -0.5 }
const ALPHA = 0.2

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
const listeners = new Set()

// ---------- 인증 ----------
export const mockAuth = {
  getSession() {
    return readJSON(SESSION_KEY, null)
  },
  onChange(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  async signIn(email) {
    await wait()
    const session = { access_token: 'mock-token', user: { id: `mock-${email}`, email } }
    writeJSON(SESSION_KEY, session)
    listeners.forEach((listener) => listener(session))
    return session
  },
  async signOut() {
    writeJSON(SESSION_KEY, null)
    listeners.forEach((listener) => listener(null))
  },
}

// ---------- 사용자 데이터 ----------
function currentUser() {
  const session = mockAuth.getSession()
  if (!session) throw makeError(401, 'invalid_token')
  return session.user
}

const stateKey = (userId) => `findme-mock-state:${userId}`

function loadState(userId) {
  return readJSON(stateKey(userId), {
    profile: null,
    vector: Array(ATTRIBUTES.length).fill(0),
    n_reactions: 0,
    impressions: [],
  })
}

function toMe(user, state) {
  return {
    user_id: user.id,
    email: user.email,
    nickname: state.profile.nickname,
    grade: state.profile.grade,
    created_at: state.profile.created_at,
    updated_at: state.profile.updated_at,
    n_reactions: state.n_reactions,
    traits: ATTRIBUTES.map((a, i) => ({ ...a, score: state.vector[i] })),
  }
}

export async function getMe() {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  if (!state.profile) throw makeError(404, 'profile_not_found')
  return toMe(user, state)
}

export async function createMe({ nickname, grade = null }) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  if (state.profile) throw makeError(409, 'profile_exists')
  const now = new Date().toISOString()
  state.profile = { nickname: nickname.trim(), grade, created_at: now, updated_at: now }
  writeJSON(stateKey(user.id), state)
  return toMe(user, state)
}

export async function updateMe(fields) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  if (!state.profile) throw makeError(404, 'profile_not_found')
  state.profile = {
    ...state.profile,
    ...fields,
    ...(fields.nickname ? { nickname: fields.nickname.trim() } : {}),
    updated_at: new Date().toISOString(),
  }
  writeJSON(stateKey(user.id), state)
  return toMe(user, state)
}

// ---------- 피드 ----------
function toFeedCard(impression) {
  const card = CARDS.find((c) => c.card_id === impression.card_id)
  return {
    impression_id: impression.id,
    source: impression.source,
    card_id: card.card_id,
    type: card.type,
    title: card.title,
    body: card.body,
    job_name: card.job_name,
    options: card.options.map(({ id, label }) => ({ id, label })),
  }
}

export async function getFeed(n = 10) {
  await wait(400)
  const user = currentUser()
  const state = loadState(user.id)

  // 백엔드와 같이, 받았지만 반응하지 않은 카드를 먼저 다시 내려줍니다.
  const items = state.impressions.filter((i) => !i.reacted).slice(0, n)
  const seen = new Set(state.impressions.map((i) => i.card_id))
  const fresh = CARDS.filter((c) => !seen.has(c.card_id))

  for (const card of fresh.slice(0, n - items.length)) {
    const source =
      state.n_reactions < 5 ? 'cold_start' : Math.random() < 0.2 ? 'random' : 'personalized'
    const impression = { id: crypto.randomUUID(), card_id: card.card_id, source, reacted: false }
    state.impressions.push(impression)
    items.push(impression)
  }

  writeJSON(stateKey(user.id), state)
  return { cards: items.map(toFeedCard) }
}

export async function postReaction({ impression_id, reaction, option_id = null }) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const impression = state.impressions.find((i) => i.id === impression_id)
  if (!impression) throw makeError(404, 'impression_not_found')
  if (impression.reacted) return { status: 'duplicate' }

  const card = CARDS.find((c) => c.card_id === impression.card_id)
  const source = reaction === 'choose' ? card.options.find((o) => o.id === option_id) : card
  if (!source) throw makeError(422, 'invalid_reaction')

  const target = source.attrs.map((x) => x / 3)
  const w = WEIGHTS[reaction]
  state.vector = state.vector.map((u, i) => {
    const next = w > 0 ? u + Math.min(ALPHA * w, 1) * (target[i] - u) : w < 0 ? u - ALPHA * -w * target[i] : u
    return Math.min(1, Math.max(0, next))
  })
  state.n_reactions += 1
  impression.reacted = true
  writeJSON(stateKey(user.id), state)
  return { status: 'recorded' }
}
