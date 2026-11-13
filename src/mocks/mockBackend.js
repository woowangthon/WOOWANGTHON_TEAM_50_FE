// 백엔드 없이 화면을 확인하기 위한 가짜 서버입니다. 데이터는 브라우저에만 저장됩니다.
// 응답 형식은 백엔드의 /me, /me/saved, /me/report, /me/journey, /feed, /reactions, /interest-survey,
// /jobs, /jobs/{id}/ask, /chat과 같게 맞췄습니다.
// 데이터(./data.js)는 백엔드 scripts/export_mock.py와 같은 형식(ATTRIBUTES · TABLES · JOBS · CARDS)입니다.
// 직업 준비 단계(커리어넷 직업 안내)는 그 스크립트가 내보내지 않아서 ./guides.js에 따로 둡니다.
// AI(Gemini) 답변은 흉내 내지 않고, 백엔드가 Gemini 없이 쓰는 대체 답변(by_ai: false)을 그대로 옮겼습니다.
import { makeError } from '../api/client.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { ATTRIBUTES, CARDS, JOBS, TABLES } from './data.js'
import { GUIDES } from './guides.js'

const SESSION_KEY = 'findme-mock-session'
const WEIGHTS = { save: 1.5, like: 1, choose: 1, pass: 0, dislike: -0.5 }
const ALPHA = 0.2
const REACTIONS = ['like', 'dislike', 'save', 'pass', 'choose']
const MIN_GAIN = 0.005
const DAY_MS = 24 * 60 * 60 * 1000
const N_SIMILAR = 4
const CHAT_DAILY_LIMIT = 30
const MAX_USER_CHARS = 300

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

const JOB_BY_ID = new Map(JOBS.map((job) => [job.id, job]))
const findCard = (cardId) => CARDS.find((c) => c.card_id === cardId)
const traitsOf = (vector) => ATTRIBUTES.map(({ code, label, group }, i) => ({ code, label, group, score: vector[i] }))

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

// ---------- 문장 도우미 (백엔드 app/report.py) ----------
const hasFinalConsonant = (word) => {
  const last = word.trim().slice(-1)
  return last >= '가' && last <= '힣' && (last.charCodeAt(0) - 0xac00) % 28 !== 0
}
const josa = (word, withFinal, withoutFinal) => word + (hasFinalConsonant(word) ? withFinal : withoutFinal)
const joinWords = (words) =>
  words.length === 1 ? words[0] : `${[...words.slice(0, -2), josa(words.at(-2), '과', '와')].join(', ')} ${words.at(-1)}`

// 직업 설명의 첫 문장 (100자까지). 목록·리포트에서 씁니다.
function firstSentence(text) {
  const clean = (text || '').split(/\s+/).join(' ').trim()
  const end = clean.indexOf('. ')
  const sentence = end === -1 ? clean : clean.slice(0, end + 1)
  return sentence.length > 100 ? `${sentence.slice(0, 99)}…` : sentence
}

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

// ---------- 카드 ----------
// 백엔드 CardOut과 같은 필드. 점수(attrs)는 내보내지 않습니다.
function cardFields(card) {
  const job = card.job_id ? JOB_BY_ID.get(card.job_id) : null
  return {
    card_id: card.card_id,
    type: card.type,
    title: card.title,
    body: card.body,
    job_id: job ? job.id : null,
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
    cards: items.map((i) => {
      const card = findCard(i.card_id)
      return {
        impression_id: i.id,
        source: i.source,
        saved: Boolean(saved[i.card_id]),
        reason: cardReason(card, state.vector, i.source),
        ...cardFields(card),
      }
    }),
  }
}

// 백엔드 app/journey.py card_reason: 내 성향과 카드가 함께 높은 축으로 '왜 이 카드?' 한 줄을 만듭니다.
function cardReason(card, vector, source) {
  if (source === 'random') return '평소와 다른 분야예요. 의외로 잘 맞을지도 몰라요.'
  if (source !== 'personalized') return null
  const overlap = card.attrs.map((x, i) => (x / 3) * vector[i])
  const best = overlap.indexOf(Math.max(...overlap))
  return overlap[best] > 0 ? `'${ATTRIBUTES[best].label}' 쪽 카드에 자주 끌려서 골랐어요.` : null
}

// 이번 반응으로 가장 많이 오른 성향 최대 k개. delta는 퍼센트 포인트입니다.
function gainsOf(before, after, k = 2) {
  return ATTRIBUTES.map((a, i) => ({ ...a, diff: after[i] - before[i] }))
    .filter((a) => a.diff > MIN_GAIN)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, k)
    .map((a) => ({ code: a.code, label: a.label, delta: Math.max(1, Math.round(a.diff * 100)) }))
}

export async function postReaction({ impression_id, reaction, option_id = null }) {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const impression = state.impressions.find((i) => i.id === impression_id)
  if (!impression) throw makeError(404, 'impression_not_found')
  if (impression.reaction || impression.reacted) {
    return { status: 'duplicate', gains: [], daily_goal: TABLES.dailyGoal, goal_reached: false, ...activity(state) }
  }

  const card = findCard(impression.card_id)
  const source = reaction === 'choose' ? card.options.find((o) => o.id === option_id) : card
  if (!source || reaction === 'save') throw makeError(422, 'invalid_reaction')

  const before = state.vector
  const target = source.attrs.map((x) => x / 3)
  const w = WEIGHTS[reaction]
  state.vector = before.map((u, i) => {
    const next = w > 0 ? u + Math.min(ALPHA * w, 1) * (target[i] - u) : w < 0 ? u - ALPHA * -w * target[i] : u
    return Math.min(1, Math.max(0, next))
  })
  state.n_reactions += 1
  impression.reaction = reaction
  impression.reacted_at = new Date().toISOString()
  writeJSON(stateKey(user.id), state)

  const { streak, today_count } = activity(state)
  return {
    status: 'recorded',
    gains: gainsOf(before, state.vector),
    today_count,
    daily_goal: TABLES.dailyGoal,
    streak,
    goal_reached: today_count === TABLES.dailyGoal,
  }
}

function reactionsOf(state) {
  return state.impressions
    .filter((i) => i.reaction)
    .sort((a, b) => b.reacted_at.localeCompare(a.reacted_at))
}

function reactionCounts(reactions) {
  return Object.fromEntries(REACTIONS.map((r) => [r, reactions.filter((i) => i.reaction === r).length]))
}

// 리포트는 성향을 만드는 반응(끌려요·선택형 답)이 minSignal개 이상이고 성향이 0이 아닐 때 열립니다. 저장은 세지 않습니다.
const signalCount = (counts) => counts.like + counts.choose
const reportReady = (counts, vector) => signalCount(counts) >= TABLES.minSignal && vector.some((x) => x > 0)

// ---------- 날짜 (한국 시간) ----------
const kstDay = (time) => new Date(new Date(time).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
const previousDay = (day) => new Date(Date.parse(day) - DAY_MS).toISOString().slice(0, 10)

// (연속 접속 일수, 오늘 반응 수). 오늘 아직 안 했어도 어제까지 이어졌으면 연속은 유지됩니다.
function activity(state, now = Date.now()) {
  const days = reactionsOf(state).map((i) => kstDay(i.reacted_at))
  const active = new Set(days)
  const today = kstDay(now)
  let cursor = active.has(today) ? today : previousDay(today)
  let streak = 0
  while (active.has(cursor)) {
    streak += 1
    cursor = previousDay(cursor)
  }
  return { streak, today_count: days.filter((day) => day === today).length }
}

// ---------- 저장 (PUT·DELETE /me/saved/{card_id}) ----------
// 저장은 반응과 별개인 북마크입니다.
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
export async function getReport() {
  await wait(500)
  const user = currentUser()
  const state = loadState(user.id)
  const reactions = reactionsOf(state)
  const counts = reactionCounts(reactions)
  const vector = state.vector
  const base = { n_reactions: state.n_reactions, traits: traitsOf(vector), reaction_counts: counts }
  const empty = { top_interests: [], strengths: [], summary: '', summary_by_ai: false, study_tips: [], jobs: [], majors: [] }

  if (!reportReady(counts, vector)) {
    return { ...base, ...empty, ready: false, remaining: Math.max(1, TABLES.minSignal - signalCount(counts)) }
  }

  // 백엔드처럼 직업 카드의 점수와 비교하고, 별로예요를 누른 직업은 뺍니다.
  const disliked = new Set(reactions.filter((i) => i.reaction === 'dislike').map((i) => findCard(i.card_id).job_id))
  const interests = topAttrs(vector, ['interest'], 2)
  const strengths = topAttrs(vector, ['style', 'value'], 2)
  const pool = CARDS.filter((c) => c.job_id && JOB_BY_ID.has(c.job_id) && !disliked.has(c.job_id))
    .map((c) => {
      const job = JOB_BY_ID.get(c.job_id)
      const score = Number(cosine(c.attrs, vector).toFixed(3))
      return {
        job_id: job.id, name: job.name, field: job.field, majors: job.majors,
        summary: firstSentence(job.summary), score, match: Math.round(score * 100),
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const weight = {}
  for (const job of pool) {
    for (const major of job.majors) weight[major] = (weight[major] || 0) + job.score / job.majors.length
  }

  const parts = []
  if (interests.length) {
    parts.push(`${interests.map((a) => a.label).join('·')} 카드에 자주 끌렸어요. ${joinWords(interests.map((a) => TABLES.interestPhrases[a.code]))}에 관심이 많아 보여요.`)
  }
  if (strengths.length) {
    parts.push(`일할 때는 ${josa(joinWords(strengths.map((a) => TABLES.strengthPhrases[a.code])), '을', '를')} 중요하게 여기는 편이에요.`)
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
    study_tips: interests.map((a) => TABLES.studyTips[a.code]),
    jobs: pool.slice(0, 5),
    majors: Object.entries(weight).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([major]) => major),
  }
}

// ---------- 관심사 설문 (GET·POST /interest-survey) ----------
// 백엔드 app/interest_survey.py와 같은 계산: 답 하나가 해당 흥미 축을 단계값 × 0.125만큼 바꿉니다.
const SURVEY_SCORES = { strongly_dislike: -2, dislike: -1, neutral: 0, like: 1, strongly_like: 2 }
const SURVEY_AXES = {
  make: 'R', repair: 'R', experiment: 'I', patterns: 'I', stories: 'A', design: 'A',
  explain: 'S', support: 'S', invite: 'E', coordinate: 'E', organize: 'C', checklist: 'C',
}

export async function getInterestSurveyStatus() {
  await wait(200)
  const user = currentUser()
  const { survey } = loadState(user.id)
  if (!survey) return { done: false, version: null, answers: null, created_at: null }
  return { done: true, version: survey.version, answers: survey.answers, created_at: survey.created_at ?? null }
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
  state.survey = { version, answers, created_at: new Date().toISOString() }
  writeJSON(stateKey(user.id), state)
  return { status: 'recorded' }
}

// ---------- 직업 (GET /jobs, GET /jobs/{job_id}) ----------
// 백엔드 app/jobs.py를 단순하게 옮겼습니다. 직업 점수(attrs, 0~3)를 0~1로 바꿔 내 성향과 비교합니다.
const jobVector = (job) => job.attrs.map((x) => x / 3)

// 적합도(0~100): 내 성향과 직업 점수의 코사인 유사도 × 100. 성향이 아직 없으면 null.
function matchOf(job, vector) {
  if (!vector.some((x) => x > 0)) return null
  return Math.round(Math.min(1, Math.max(0, cosine(jobVector(job), vector))) * 100)
}

function jobSummary(job, vector) {
  return { job_id: job.id, name: job.name, field: job.field, summary: firstSentence(job.summary), match: matchOf(job, vector) }
}

// 적합도 높은 순. 성향이 없으면 직업 코드 순 (match=null).
function rankJobs(vector, field = null) {
  return JOBS.filter((job) => !field || job.field === field)
    .map((job) => jobSummary(job, vector))
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0) || a.job_id - b.job_id)
}

// 준비 단계는 백엔드 app/roadmap.py와 같은 순서입니다. 문장은 모두 커리어넷 원문입니다.
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

function buildSteps(job) {
  const guide = GUIDES[job.id]
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
  return Object.entries(items).filter(([, list]) => list.length).map(([key, list]) => ({ key, title: STEP_TITLES[key], items: list }))
}

function jobDetail(jobId, vector) {
  const job = JOB_BY_ID.get(Number(jobId))
  if (!job) return null
  const own = jobVector(job)
  const traits = ATTRIBUTES.map((a, idx) => ({ ...a, idx }))
    .filter((a) => own[a.idx] > 0)
    .sort((a, b) => own[b.idx] - own[a.idx] || a.idx - b.idx)
    .map((a) => ({
      code: a.code,
      label: a.label,
      group: a.group,
      definition: a.definition,
      level: Math.round(own[a.idx] * 3),
      mine: Math.round(vector[a.idx] * 100),
    }))
  const similar = JOBS.filter((other) => other.id !== job.id)
    .map((other) => ({ other, sim: cosine(own, jobVector(other)) }))
    .sort((a, b) => b.sim - a.sim || a.other.id - b.other.id)
    .slice(0, N_SIMILAR)
    .map(({ other }) => jobSummary(other, vector))

  return {
    job_id: job.id,
    name: job.name,
    field: job.field,
    summary: job.summary,
    majors: job.majors,
    match: matchOf(job, vector),
    traits,
    steps: buildSteps(job),
    similar,
  }
}

// 이 직업에 물어볼 수 있는 질문. 적합도가 아직 없으면 '왜 맞나요'는 뺍니다. (백엔드 job_questions)
const jobQuestions = (detail) => Object.entries(TABLES.jobQuestions)
  .filter(([id]) => id !== 'why_match' || detail.match !== null)
  .map(([id, label]) => ({ id, label }))

export async function getJobs({ field = null, limit = 30 } = {}) {
  await wait()
  const user = currentUser()
  const { vector } = loadState(user.id)
  const fields = [...new Set(JOBS.map((job) => job.field).filter(Boolean))].sort()
  return { fields, jobs: rankJobs(vector, field).slice(0, limit) }
}

export async function getJob(jobId) {
  await wait()
  const user = currentUser()
  const detail = jobDetail(jobId, loadState(user.id).vector)
  if (!detail) throw makeError(404, 'job_not_found')
  return { ...detail, questions: jobQuestions(detail) }
}

// ---------- AI 진로 동료 (POST /jobs/{job_id}/ask, POST /chat) ----------
// 백엔드 app/llm/coach.py의 대체 답변(fallback_answer, fallback_chat)을 옮겼습니다.
function fallbackAnswer(detail, questionId) {
  const { traits } = detail
  if (questionId === 'why_match') {
    const shared = traits.filter((t) => t.mine > 0).sort((a, b) => b.level * b.mine - a.level * a.mine).slice(0, 2)
    const core = traits.slice(0, 2).map((t) => t.label).join('·')
    if (!shared.length) {
      return `이 직업은 ${core} 비중이 큰데, 아직 그쪽 카드에는 많이 끌리지 않아서 ${detail.match}%로 나왔어요. 반응이 쌓이면 달라질 수 있어요.`
    }
    const mine = shared.map((t) => `${t.label} ${t.mine}%`).join(', ')
    return `이 직업은 ${core} 비중이 커요. 지금까지 내 반응에서도 ${mine}로 겹치는 부분이 있어서 ${detail.match}%로 계산됐어요.`
  }
  if (questionId === 'day') {
    const sentences = detail.summary.replaceAll('…', '.').split('. ').map((s) => s.trim()).filter(Boolean)
    return sentences.length ? `${sentences.slice(0, 2).join('. ').replace(/\.$/, '')}.` : '아직 자세한 설명이 준비되지 않았어요.'
  }
  if (questionId === 'hard') {
    const top = traits.slice(0, 2)
    return `${detail.name}처럼 ${top.map((t) => t.label).join('·')} 성격이 강한 일에서는 보통 ${top.map((t) => TABLES.hardTips[t.code]).join(', ')}. 사람마다 다르게 느낄 수 있어요.`
  }
  const items = detail.steps.length ? detail.steps[0].items.slice(0, 2) : []
  if (!items.length) return '관심 가는 부분을 하나 골라 더 찾아보는 것부터 시작해 보세요.'
  return items.map((i) => (i.title ? `${i.title}: ${i.detail}` : i.detail)).join(' ')
}

export async function askJob(jobId, { question_id }) {
  await wait(500)
  const user = currentUser()
  const detail = jobDetail(jobId, loadState(user.id).vector)
  if (!detail) throw makeError(404, 'job_not_found')
  if (!(question_id in TABLES.jobQuestions)) throw makeError(422, 'validation_error')
  if (question_id === 'why_match' && detail.match === null) throw makeError(422, 'no_match_yet')
  return { answer: fallbackAnswer(detail, question_id), by_ai: false }
}

function fallbackChat(vector) {
  const persona = personaOf(topAttrs(vector, ['interest'], 2))
  let reply
  if (!persona) {
    reply = '아직 반응이 적어서 성향이 잘 보이지 않아요. 홈에서 마음에 드는 카드에 끌려요를 눌러 보면, 그 기록으로 더 잘 이야기해 줄 수 있어요.'
  } else {
    reply = `지금까지 반응을 보면 '${persona.name}' 유형에 가까워요.`
    const jobs = rankJobs(vector).slice(0, 5).filter((job) => job.match !== null)
    if (jobs.length) {
      reply += ` 잘 맞는 직업으로는 ${jobs.slice(0, 3).map((job) => job.name).join(', ')} 등이 있어요. 탐색 탭에서 눌러 보면 준비할 것도 볼 수 있어요.`
    }
  }
  return { reply, suggestions: TABLES.chatStarters.slice(0, 3) }
}

export async function sendChat({ messages }) {
  await wait(700)
  const user = currentUser()
  const valid = Array.isArray(messages) && messages.length >= 1 && messages.length <= 20
    && messages.every((m) => ['user', 'ai'].includes(m.role) && typeof m.text === 'string'
      && m.text.trim().length >= 1 && m.text.trim().length <= 500)
  if (!valid) throw makeError(422, 'validation_error')
  const last = messages.at(-1)
  if (last.role !== 'user' || last.text.length > MAX_USER_CHARS) throw makeError(422, 'invalid_message')
  // 위기 표현은 AI를 거치지 않고 정해진 안내로 답합니다.
  if (TABLES.crisisWords.some((word) => last.text.includes(word))) {
    return { reply: TABLES.crisisReply, suggestions: [], by_ai: false }
  }

  const state = loadState(user.id)
  const today = kstDay(Date.now())
  const used = state.chatUsage?.day === today ? state.chatUsage.used : 0
  if (used >= CHAT_DAILY_LIMIT) throw makeError(429, 'chat_limit')
  state.chatUsage = { day: today, used: used + 1 }
  writeJSON(stateKey(user.id), state)
  return { ...fallbackChat(state.vector), by_ai: false }
}

// ---------- 여정 (GET /me/journey) ----------
// 백엔드 app/journey.py를 옮겼습니다. 전부 반응 기록과 성향 점수에서 계산합니다.
function levelOf(n) {
  const levels = TABLES.levels
  const idx = levels.findLastIndex(([need]) => n >= need)
  const base = levels[idx][0]
  const nextAt = idx + 1 < levels.length ? levels[idx + 1][0] : null
  const progress = nextAt === null ? 1 : (n - base) / (nextAt - base)
  return { n: idx + 1, name: levels[idx][1], next_at: nextAt, progress: Number(progress.toFixed(3)) }
}

function personaOf(tops) {
  if (!tops.length) return null
  const first = tops[0].code
  return {
    code: tops.map((a) => a.code).join(''),
    name: tops.length === 1 ? TABLES.personaNoun[first] : `${TABLES.personaAdj[tops[1].code]} ${TABLES.personaNoun[first]}`,
    tagline: TABLES.personaTagline[first],
    labels: tops.map((a) => a.label),
  }
}

// 가장 끌린 흥미 유형에 맞춰 날짜마다 바뀝니다. 같은 날에는 같은 미션입니다.
function missionOf(top, today) {
  const pool = top ? TABLES.missions[top.code] : TABLES.defaultMissions
  return {
    id: `${today}-${top ? top.code : 'start'}`,
    text: pool[Math.floor(Date.parse(today) / DAY_MS) % pool.length],
    trait: top ? top.label : null,
  }
}

function badgesOf(state, reactions, streak, ready) {
  const count = (kind) => reactions.filter((i) => i.reaction === kind).length
  const fields = new Set(reactions.map((i) => JOB_BY_ID.get(findCard(i.card_id)?.job_id)?.field).filter(Boolean))
  const rules = [
    ['first_step', '첫 발자국', '첫 카드에 반응했어요', reactions.length >= 1],
    ['collector', '수집가', '카드를 3장 저장했어요', Object.keys(state.saved || {}).length >= 3],
    ['decider', '결정 장인', '선택형 카드에 5번 답했어요', count('choose') >= 5],
    ['explorer', '분야 탐험가', '5개 분야의 직업을 살펴봤어요', fields.size >= 5],
    ['streak3', '3일 연속', '3일 연속으로 탐색했어요', streak >= 3],
    ['streak7', '일주일 연속', '7일 연속으로 탐색했어요', streak >= 7],
    ['report', '나를 발견', '성향 리포트를 열었어요', ready],
  ]
  return rules.map(([id, name, description, earned]) => ({ id, name, description, earned: Boolean(earned) }))
}

export async function getJourney() {
  await wait()
  const user = currentUser()
  const state = loadState(user.id)
  const reactions = reactionsOf(state)
  const { streak, today_count } = activity(state)
  const counts = reactionCounts(reactions)
  const ready = reportReady(counts, state.vector)
  const tops = topAttrs(state.vector, ['interest'], 2)
  return {
    streak,
    today_count,
    daily_goal: TABLES.dailyGoal,
    n_reactions: state.n_reactions,
    level: levelOf(state.n_reactions),
    persona: personaOf(tops),
    report_ready: ready,
    report_remaining: ready ? 0 : Math.max(1, TABLES.minSignal - signalCount(counts)),
    mission: missionOf(tops[0], kstDay(Date.now())),
    badges: badgesOf(state, reactions, streak, ready),
  }
}
