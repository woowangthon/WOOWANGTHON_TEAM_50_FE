// Supabase Auth 오류를 사용자에게 보여 줄 문장으로 바꿉니다.
const MESSAGES = {
  invalid_credentials: '이메일 또는 비밀번호가 맞지 않아요.',
  email_not_confirmed: '이메일 인증이 아직 안 됐어요. 메일함에서 인증 링크를 눌러 주세요.',
  user_already_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  email_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  weak_password: '비밀번호가 너무 단순해요. 더 길게 만들어 주세요.',
  over_email_send_rate_limit: '메일 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  over_request_rate_limit: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  signup_disabled: '지금은 회원가입을 받지 않아요.',
  email_address_invalid: '사용할 수 없는 이메일 주소예요.',
}

export class AuthError extends Error {
  constructor(code) {
    super(MESSAGES[code] || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.')
    this.code = code
  }
}

export function toAuthError(error) {
  if (error instanceof AuthError) return error
  // 네트워크 오류는 status 0으로 옵니다.
  if (error?.status === 0 || error?.name === 'AuthRetryableFetchError') {
    const networkError = new AuthError('network_error')
    networkError.message = '서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'
    return networkError
  }
  return new AuthError(error?.code)
}
