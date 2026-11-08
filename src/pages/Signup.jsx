import { useState } from 'react'
import AuthIcon from '../components/AuthIcon.jsx'
import { validateSignup } from '../utils/validateSignup.js'
import './Login.css'

const fields = [
  { name: 'email', label: '이메일', placeholder: '이메일을 입력해 주세요', autoComplete: 'username' },
  { name: 'password', label: '비밀번호', placeholder: '비밀번호를 입력해 주세요', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: '비밀번호 확인', placeholder: '비밀번호를 한 번 더 입력해 주세요', autoComplete: 'new-password' },
]

export default function Signup() {
  const [values, setValues] = useState({ email: '', password: '', confirmPassword: '' })
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false })
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false })
  const [message, setMessage] = useState('')
  const errors = validateSignup(values)

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
    setTouched({ email: true, password: true, confirmPassword: true })
    setMessage('')

    const firstInvalidField = Object.keys(errors)[0]
    if (firstInvalidField) {
      event.currentTarget.elements.namedItem(firstInvalidField).focus()
      return
    }

    // 회원가입 API가 준비되면 여기에서 요청을 연결합니다.
    setMessage('입력값 검사가 완료됐어요. 실제 회원가입 기능은 아직 준비 중이에요.')
  }

  return (
    <div className="login-page">
      <header className="login-site-header">
        <div className="login-brand">FindME</div>
      </header>

      <main className="login-content" aria-labelledby="signup-title">
        <header className="login-header">
          <div className="login-mark"><AuthIcon name="sprout" /></div>
          <h1 id="signup-title">회원가입</h1>
          <p className="login-description">FindME에 오신 걸 환영해요.<br />나를 찾는 여정, 지금 함께 시작해요.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {fields.map(({ name, label, placeholder, autoComplete }) => {
            const isPassword = name !== 'email'
            const error = touched[name] ? errors[name] : undefined
            const inputId = `signup-${name}`

            return (
              <div className="login-field" key={name}>
                <label htmlFor={inputId}>{label}</label>
                <div className={`login-input-wrap${isPassword ? ' password-control' : ''}`}>
                  <AuthIcon name={isPassword ? 'lock' : 'mail'} />
                  <input
                    id={inputId}
                    name={name}
                    type={isPassword ? (visiblePasswords[name] ? 'text' : 'password') : 'email'}
                    autoComplete={autoComplete}
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={placeholder}
                    value={values[name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                  />
                  {isPassword && (
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={`${label} ${visiblePasswords[name] ? '숨기기' : '보기'}`}
                      aria-controls={inputId}
                      aria-pressed={visiblePasswords[name]}
                      onClick={() => setVisiblePasswords((previous) => ({ ...previous, [name]: !previous[name] }))}
                    >
                      <AuthIcon name={visiblePasswords[name] ? 'eye-off' : 'eye'} />
                    </button>
                  )}
                </div>
                {error && <p id={`${inputId}-error`} className="field-error" aria-live="polite">{error}</p>}
              </div>
            )
          })}

          <button className="login-submit" type="submit">회원가입 <AuthIcon name="arrow" /></button>
          <p className="login-message" role="status">{message}</p>
        </form>
        <p className="auth-switch">이미 계정이 있으신가요? <a href="/">로그인하기</a></p>
      </main>

      <footer className="login-footer">나를 찾는 여정, FindME</footer>
    </div>
  )
}
