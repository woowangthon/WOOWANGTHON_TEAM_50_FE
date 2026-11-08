// 비밀번호 길이와 조합 규칙은 백엔드 정책이 정해진 뒤 추가합니다.
export function validateLogin({ email, password }) {
  const errors = {}

  if (!email.trim()) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = '올바른 이메일 형식을 입력해 주세요.'
  }

  // 비밀번호는 공백도 원래 입력값의 일부이므로 trim하지 않습니다.
  if (!password) {
    errors.password = '비밀번호를 입력해 주세요.'
  }

  return errors
}
