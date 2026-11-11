// 백엔드 없이 화면을 확인하기 위한 가짜 서버입니다.
// 응답 형식은 백엔드의 /me, /me/saved, /me/report, /feed, /reactions와 같게 맞췄고, 데이터는 브라우저에만 저장됩니다.
import { makeError } from '../api/client.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { ATTRIBUTES, CARDS, INTEREST_PHRASES, JOBS, STRENGTH_PHRASES, STUDY_TIPS } from './data.js'
import { GUIDES } from './guides.js'

const SESSION_KEY = 'findme-mock-session'
const WEIGHTS = { save: 1.5, like: 1, choose: 1, pass: 0, dislike: -0.5 }
const ALPHA = 0.2
const REACTIONS = ['like', 'dislike', 'save', 'pass', 'choose']

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
    saved: {}, // { card_id: saved_at }
  })
}

const findCard = (cardId) => CARDS.find((c) => c.card_id === cardId)
const traitsOf = (vector) => ATTRIBUTES.map((a, i) => ({ ...a, score: vector[i] }))

function toMe(user, state) {
  return {
    user_id: user.id,
    email: user.email,
    nickname: state.profile.nickname,
    grade: state.profile.grade,
    created_at: state.profile.created_at,
    updated_at: state.profile.updated_at,
    n_reactions: state.n_reactions,
    traits: traitsOf(state.vector),
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

// ---------- 카드 ----------
// 백엔드 CardOut과 같은 필드. 점수(attrs)는 내보내지 않습니다.
function cardFields(card) {
  const job = card.job_id ? JOBS[card.job_id] : null
  return {
    card_id: card.card_id,
    type: card.type,
    title: card.title,
    body: card.body,
    job_name: job ? job.name : null,
    majors: job ? job.majors : [],
    options: card.options.map(({ id, label }) => ({ id, label })),
  }
}

export async function getFeed(n = 10) {
  await wait(400)
  const user = currentUser()
  const state = loadState(user.id)

  // 백엔드와 같이, 받았지만 반응하지 않은 카드를 먼저 다시 내려줍니다.
  const items = state.impressions.filter((i) => !i.reaction && !i.reacted).slice(0, n)
  const seen = new Set(state.impressions.map((i) => i.card_id))
  const fresh = CARDS.filter((c) => !seen.has(c.card_id))

  for (const card of fresh.slice(0, n - items.length)) {
    const source =
      state.n_reactions < 5 ? 'cold_start' : Math.random() < 0.2 ? 'random' : 'personalized'
    const impression = { id: crypto.randomUUID(), card_id: card.card_id, source }
    state.impressions.push(impression)
    items.push(impression)
  }

  writeJSON(stateKey(user.id), state)
  const saved = state.saved || {}
  return {
    cards: items.map((i) => ({
      impression_id: i.id,
      source: i.source,
      saved: Boolean(saved[i.card_id]),
      ...cardFields(findCard(i.card_id)),
    })),
  }
}

export async function postReaction({ impression_id, reaction, option_id = null }) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const impression = state.impressions.find((i) => i.id === impression_id)
  if (!impression) throw makeError(404, 'impression_not_found')
  if (impression.reaction || impression.reacted) return { status: 'duplicate' }

  const card = findCard(impression.card_id)
  const source = reaction === 'choose' ? card.options.find((o) => o.id === option_id) : card
  if (!source) throw makeError(422, 'invalid_reaction')

  const target = source.attrs.map((x) => x / 3)
  const w = WEIGHTS[reaction]
  state.vector = state.vector.map((u, i) => {
    const next = w > 0 ? u + Math.min(ALPHA * w, 1) * (target[i] - u) : w < 0 ? u - ALPHA * -w * target[i] : u
    return Math.min(1, Math.max(0, next))
  })
  state.n_reactions += 1
  impression.reaction = reaction
  impression.reacted_at = new Date().toISOString()
  writeJSON(stateKey(user.id), state)
  return { status: 'recorded' }
}

function reactionsOf(state) {
  return state.impressions
    .filter((i) => i.reaction)
    .sort((a, b) => b.reacted_at.localeCompare(a.reacted_at))
}

// 저장은 반응과 별개인 북마크입니다. (백엔드에 요청한 PUT·DELETE /me/saved/{card_id}를 흉내 냅니다)
export async function getSaved() {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const cards = Object.entries(state.saved || {})
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([cardId, savedAt]) => ({ saved_at: savedAt, ...cardFields(findCard(cardId)) }))
  return { cards }
}

export async function saveCard(cardId) {
  await wait(150)
  const user = currentUser()
  const state = loadState(user.id)
  if (!findCard(cardId)) throw makeError(404, 'card_not_found')
  state.saved = { ...(state.saved || {}), [cardId]: state.saved?.[cardId] || new Date().toISOString() }
  writeJSON(stateKey(user.id), state)
  return null
}

export async function unsaveCard(cardId) {
  await wait(150)
  const user = currentUser()
  const state = loadState(user.id)
  const rest = { ...(state.saved || {}) }
  delete rest[cardId]
  state.saved = rest
  writeJSON(stateKey(user.id), state)
  return null
}

// ---------- 리포트 (백엔드 app/report.py를 단순하게 옮김) ----------
const hasFinalConsonant = (word) => {
  const last = word.trim().slice(-1)
  return last >= '가' && last <= '힣' && (last.charCodeAt(0) - 0xac00) % 28 !== 0
}
const josa = (word, withFinal, withoutFinal) => word + (hasFinalConsonant(word) ? withFinal : withoutFinal)
const joinWords = (words) =>
  words.length === 1 ? words[0] : `${[...words.slice(0, -2), josa(words.at(-2), '과', '와')].join(', ')} ${words.at(-1)}`

function topAttrs(vector, groups, k) {
  return ATTRIBUTES.map((a, idx) => ({ ...a, idx }))
    .filter((a) => groups.includes(a.group) && vector[a.idx] > 0)
    .sort((a, b) => vector[b.idx] - vector[a.idx] || a.idx - b.idx)
    .slice(0, k)
}

function cosine(a, b) {
  const dot = a.reduce((sum, x, i) => sum + x * b[i], 0)
  const norm = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
  return dot / (norm(a) * norm(b) || 1)
}

export async function getReport() {
  await wait(500)
  const user = currentUser()
  const state = loadState(user.id)
  const reactions = reactionsOf(state)
  const counts = Object.fromEntries(REACTIONS.map((r) => [r, reactions.filter((i) => i.reaction === r).length]))
  const vector = state.vector
  const base = { n_reactions: state.n_reactions, traits: traitsOf(vector), reaction_counts: counts }
  const empty = { top_interests: [], strengths: [], summary: '', summary_by_ai: false, study_tips: [], jobs: [], majors: [] }

  // 백엔드에 요청한 규칙: 최소 개수 없이, 끌려요가 1개 이상이면 리포트를 엽니다.
  if (counts.like < 1 || !vector.some((x) => x > 0)) {
    return { ...base, ...empty, ready: false, remaining: 1 }
  }

  const disliked = new Set(reactions.filter((i) => i.reaction === 'dislike').map((i) => findCard(i.card_id).job_id))
  const interests = topAttrs(vector, ['interest'], 2)
  const strengths = topAttrs(vector, ['style', 'value'], 2)
  const pool = CARDS.filter((c) => c.job_id && !disliked.has(c.job_id))
    .map((c) => ({ job_id: c.job_id, ...JOBS[c.job_id], score: Number(cosine(c.attrs, vector).toFixed(3)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const weight = {}
  for (const job of pool) {
    for (const major of job.majors) weight[major] = (weight[major] || 0) + job.score / job.majors.length
  }

  const parts = []
  if (interests.length) {
    parts.push(`${interests.map((a) => a.label).join('·')} 카드에 자주 끌렸어요. ${joinWords(interests.map((a) => INTEREST_PHRASES[a.code]))}에 관심이 많아 보여요.`)
  }
  if (strengths.length) {
    parts.push(`일할 때는 ${josa(joinWords(strengths.map((a) => STRENGTH_PHRASES[a.code])), '을', '를')} 중요하게 여기는 편이에요.`)
  }

  const toTrait = ({ code, label, group, idx }) => ({ code, label, group, score: vector[idx] })
  return {
    ...base,
    ready: true,
    remaining: 0,
    top_interests: interests.map(toTrait),
    strengths: strengths.map(toTrait),
    summary: parts.join(' ') || '아직 뚜렷하게 끌리는 쪽이 보이지 않아요. 카드를 더 둘러보면 성향이 드러나요.',
    summary_by_ai: false,
    study_tips: interests.map((a) => STUDY_TIPS[a.code]),
    jobs: pool.slice(0, 5),
    majors: Object.entries(weight).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([major]) => major),
  }
}

// ---------- 관심사 설문 (POST /interest-survey) ----------
// 백엔드 app/interest_survey.py와 같은 계산: 답 하나가 해당 흥미 축을 단계값 × 0.125만큼 바꿉니다.
const SURVEY_SCORES = { strongly_dislike: -2, dislike: -1, neutral: 0, like: 1, strongly_like: 2 }
const SURVEY_AXES = {
  make: 'R', repair: 'R', experiment: 'I', patterns: 'I', stories: 'A', design: 'A',
  explain: 'S', support: 'S', invite: 'E', coordinate: 'E', organize: 'C', checklist: 'C',
}

export async function submitInterestSurvey({ version, answers }) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const ids = Object.keys(SURVEY_AXES)
  const valid = version === 1
    && Object.keys(answers).length === ids.length
    && ids.every((id) => answers[id] in SURVEY_SCORES)
  if (!valid) throw makeError(422, 'invalid_survey')
  if (state.survey) return { status: 'duplicate' }

  state.vector = state.vector.map((u, i) => {
    const code = ATTRIBUTES[i].code
    const delta = ids.filter((id) => SURVEY_AXES[id] === code).reduce((sum, id) => sum + SURVEY_SCORES[answers[id]] * 0.125, 0)
    return Math.min(1, Math.max(0, u + delta))
  })
  state.survey = { version, answers }
  writeJSON(stateKey(user.id), state)
  return { status: 'recorded' }
}

// ---------- 로드맵 (GET /me/roadmap, GET /me/roadmap/{job_id}) ----------
// 백엔드 app/roadmap.py를 단순하게 옮겼습니다. 문장은 모두 커리어넷 원문입니다.
const STEP_TITLES = {
  explore: '지금 해 볼 수 있는 일',
  grow: '키워 볼 능력',
  study: '진학 준비',
  career: '자격과 진출',
}

function growItems(guide) {
  const used = new Set()
  const items = guide.abilities.map((ability) => {
    const sentence = guide.aptitudes.find((s) => s.includes(ability) && !used.has(s))
    if (sentence) used.add(sentence)
    return { title: ability, detail: sentence || `${josa(ability, '이', '가')} 필요해요.` }
  })
  return [...items, ...guide.aptitudes.filter((s) => !used.has(s)).map((detail) => ({ title: null, detail }))]
}

function buildRoadmap(jobId, vector, savedAt = null) {
  const job = JOBS[jobId]
  if (!job) return null
  const guide = GUIDES[jobId]
  const card = CARDS.find((c) => c.job_id === jobId)
  const traits = card
    ? ATTRIBUTES.map((a, idx) => ({ ...a, idx }))
      .filter((a) => card.attrs[a.idx] > 0)
      .sort((a, b) => card.attrs[b.idx] - card.attrs[a.idx] || a.idx - b.idx)
      .map((a) => ({ code: a.code, label: a.label, group: a.group, job_score: card.attrs[a.idx], my_score: vector[a.idx] }))
    : []

  const study = guide ? guide.education.map((detail) => ({ title: null, detail })) : []
  if (job.majors.length) study.push({ title: '관련 학과', detail: job.majors.join(', ') })
  const items = {
    explore: guide ? guide.activities : [],
    grow: guide ? growItems(guide) : [],
    study,
    career: guide
      ? [...guide.certificates.map((detail) => ({ title: '자격증', detail })), ...guide.careers.map((detail) => ({ title: '진출 분야', detail }))]
      : [],
  }

  return {
    job_id: jobId,
    name: job.name,
    field: job.field,
    summary: job.summary,
    majors: job.majors,
    card_id: card ? card.card_id : null,
    saved_at: savedAt,
    traits,
    steps: Object.entries(items).filter(([, list]) => list.length).map(([key, list]) => ({ key, title: STEP_TITLES[key], items: list })),
  }
}

function savedJobs(state) {
  const jobs = new Map()
  Object.entries(state.saved || {})
    .sort((a, b) => b[1].localeCompare(a[1]))
    .forEach(([cardId, savedAt]) => {
      const jobId = findCard(cardId)?.job_id
      if (jobId && !jobs.has(jobId)) jobs.set(jobId, savedAt)
    })
  return jobs
}

export async function getRoadmaps() {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  return { jobs: [...savedJobs(state)].map(([jobId, savedAt]) => buildRoadmap(jobId, state.vector, savedAt)) }
}

export async function getRoadmap(jobId) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const roadmap = buildRoadmap(Number(jobId), state.vector, savedJobs(state).get(Number(jobId)) || null)
  if (!roadmap) throw makeError(404, 'job_not_found')
  return roadmap
}
