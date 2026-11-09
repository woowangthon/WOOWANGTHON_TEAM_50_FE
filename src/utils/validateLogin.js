// Supabase 기본 정책에 맞춰 회원가입 비밀번호는 6자 이상만 확인합니다.
export const MIN_PASSWORD_LENGTH = 6

export function validateLogin({ email, password }, mode = 'login') {
  const errors = {}

  if (!email.trim()) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = '올바른 이메일 형식을 입력해 주세요.'
  }

  // 비밀번호는 공백도 원래 입력값의 일부이므로 trim하지 않습니다.
  if (!password) {
    errors.password = '비밀번호를 입력해 주세요.'
  } else if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상으로 만들어 주세요.`
  }

  return errors
}
