import { useState } from 'react'
import AuthIcon from '../components/AuthIcon.jsx'
import { validateLogin } from '../utils/validateLogin.js'
import './Login.css'


export default function Login() {
  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const errors = validateLogin(values)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((previous) => ({ ...previous, [name]: true }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setMessage('')

    const firstInvalidField = Object.keys(errors)[0]
    if (firstInvalidField) {
      event.currentTarget.elements.namedItem(firstInvalidField).focus()
      return
    }

    // 로그인 API가 준비되면 여기에서 요청을 연결합니다.
    setMessage('입력값 검사가 완료됐어요. 실제 로그인 기능은 아직 준비 중이에요.')
  }

  const emailError = touched.email ? errors.email : undefined
  const passwordError = touched.password ? errors.password : undefined

  return (
    <div className="login-page">
      <header className="login-site-header">
        <div className="login-brand">FindME</div>
      </header>

      <main className="login-content" aria-labelledby="login-title">
        <header className="login-header">
          <div className="login-mark"><AuthIcon name="sprout" /></div>
          <h1 id="login-title">로그인</h1>
          <p className="login-description">다시 만나서 반가워요.<br />FindME와 함께 나를 찾는 여정을 시작해요.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="email">이메일</label>
            <div className="login-input-wrap">
              <AuthIcon name="mail" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="이메일을 입력해 주세요"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
            </div>
            {emailError && <p id="email-error" className="field-error" aria-live="polite">{emailError}</p>}
          </div>

          <div className="login-field">
            <label htmlFor="password">비밀번호</label>
            <div className="login-input-wrap password-control">
              <AuthIcon name="lock" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호를 입력해 주세요"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-controls="password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((previous) => !previous)}
              >
                <AuthIcon name={showPassword ? 'eye-off' : 'eye'} />
              </button>
            </div>
            {passwordError && <p id="password-error" className="field-error" aria-live="polite">{passwordError}</p>}
          </div>

          <button className="login-submit" type="submit">로그인 <AuthIcon name="arrow" /></button>
          <p className="login-message" role="status">{message}</p>
        </form>
        <p className="auth-switch">계정이 없으신가요? <a href="/signup">회원가입하기</a></p>
      </main>

      <footer className="login-footer">나를 찾는 여정, FindME</footer>
    </div>
  )
}
