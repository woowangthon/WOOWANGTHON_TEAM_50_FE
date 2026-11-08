import { useState } from 'react'
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
    <main className="login-page">
      <div className="login-brand" aria-label="FindME">
        <span className="brand-symbol" aria-hidden="true">f.</span>
        <span>Find<span className="brand-accent">ME</span></span>
      </div>

      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1 id="login-title">다시 만나서 반가워요</h1>
          <p className="login-description">FindME에 로그인하고 시작해 보세요.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@example.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && <p id="email-error" className="field-error" aria-live="polite">{emailError}</p>}
          </div>

          <div className="login-field">
            <label htmlFor="password">비밀번호</label>
            <div className="password-control">
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
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
            {passwordError && <p id="password-error" className="field-error" aria-live="polite">{passwordError}</p>}
          </div>

          <button className="login-submit" type="submit">로그인 <span aria-hidden="true">↗</span></button>
          <p className="login-message" role="status">{message}</p>
        </form>
      </section>

      <p className="login-footer">나를 찾는 여정, FindME</p>
    </main>
  )
}
