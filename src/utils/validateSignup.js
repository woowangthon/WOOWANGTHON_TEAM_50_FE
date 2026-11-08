import { validateLogin } from './validateLogin.js'

export function validateSignup({ email, password, confirmPassword }) {
  const errors = validateLogin({ email, password })

  if (!confirmPassword) {
    errors.confirmPassword = '비밀번호를 한 번 더 입력해 주세요.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않아요.'
  }

  return errors
}
