import { API_BASE_URL } from '../lib/config.js'
import { supabase } from '../lib/supabase.js'

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const MESSAGES = {
  invalid_token: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  auth_unavailable: '로그인 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
  profile_not_found: '프로필이 아직 없어요.',
  profile_exists: '이미 프로필이 있어요.',
  impression_not_found: '이 카드는 더 이상 반응할 수 없어요.',
  invalid_reaction: '반응을 저장하지 못했어요. 다른 버튼을 눌러 주세요.',
  reaction_conflict: '반응이 겹쳐서 저장하지 못했어요. 다시 눌러 주세요.',
  validation_error: '입력값을 다시 확인해 주세요.',
  invalid_survey: '설문 답변을 저장하지 못했어요. 모든 질문에 답했는지 확인해 주세요.',
  survey_conflict: '설문 답변이 겹쳐서 저장하지 못했어요. 다시 눌러 주세요.',
  card_not_found: '이 카드를 찾지 못했어요. 새로고침한 뒤 다시 시도해 주세요.',
  job_not_found: '이 직업 정보를 찾지 못했어요.',
  network_error: '서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
}

export function errorMessage(error) {
  if (error instanceof ApiError) return error.message
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

export function makeError(status, code) {
  return new ApiError(status, code, MESSAGES[code] || `요청을 처리하지 못했어요. (${status})`)
}

// FastAPI는 { detail: "profile_not_found" } 또는 검증 오류 시 { detail: [...] } 형태로 답합니다.
async function readErrorCode(response) {
  try {
    const body = await response.json()
    return typeof body.detail === 'string' ? body.detail : 'validation_error'
  } catch {
    return 'unknown_error'
  }
}

export async function apiFetch(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw makeError(0, 'network_error')
  }

  if (!response.ok) {
    const code = await readErrorCode(response)
    // 토큰이 만료되면 로그아웃시켜 로그인 화면으로 돌려보냅니다.
    if (response.status === 401) await supabase.auth.signOut()
    throw makeError(response.status, code)
  }

  return response.status === 204 ? null : response.json()
}
