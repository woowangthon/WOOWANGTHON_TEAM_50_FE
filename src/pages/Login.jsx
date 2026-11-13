import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { wakeServer } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.js'
import { USE_MOCK } from '../lib/config.js'
import MockNotice from '../components/MockNotice.jsx'
import BrandLogo from '../components/BrandLogo.jsx'
import { MIN_PASSWORD_LENGTH, validateLogin } from '../utils/validateLogin.js'
import './Login.css'

const COPY = {
  login: {
    eyebrow: 'WELCOME BACK',
    title: '다시 만나서 반가워요',
    description: 'FindME에 로그인하고 시작해 보세요.',
    submit: '로그인',
    pending: '로그인하는 중…',
    switchText: '처음 오셨나요?',
    switchAction: '회원가입',
  },
  signup: {
    eyebrow: 'NICE TO MEET YOU',
    title: 'FindME를 시작해 볼까요?',
    description: '이메일과 비밀번호만 있으면 계정을 만들 수 있어요.',
    submit: '회원가입',
    pending: '계정을 만드는 중…',
    switchText: '이미 계정이 있나요?',
    switchAction: '로그인',
  },
}

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', tone: 'info' })
  const errors = validateLogin(values, mode)
  const copy = COPY[mode]

  // 배포 서버가 잠들어 있으면 깨어나는 데 50초쯤 걸리므로, 로그인 정보를 적는 동안 미리 깨웁니다.
  useEffect(() => {
    if (!USE_MOCK) wakeServer()
  }, [])

  // 이미 로그인했다면 로그인 화면 대신 홈으로 보냅니다. (제출 중에는 아래 handleSubmit이 이동을 맡습니다)
  if (session && !submitting) return <Navigate to={location.state?.from || '/home'} replace />

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setMessage({ text: '', tone: 'info' })
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((previous) => ({ ...previous, [name]: true }))
  }

  function switchMode() {
    setMode((previous) => (previous === 'login' ? 'signup' : 'login'))
    setTouched({ email: false, password: false })
    setMessage({ text: '', tone: 'info' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setMessage({ text: '', tone: 'info' })

    const firstInvalidField = Object.keys(errors)[0]
    if (firstInvalidField) {
      event.currentTarget.elements.namedItem(firstInvalidField).focus()
      return
    }

    const email = values.email.trim()
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, values.password)
        navigate(location.state?.from || '/home', { replace: true })
        return
      }

      const { needsConfirmation } = await signUp(email, values.password)
      if (needsConfirmation) {
        setMode('login')
        setValues((previous) => ({ ...previous, password: '' }))
        setTouched({ email: false, password: false })
        setMessage({
          text: `${email}로 인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.`,
          tone: 'success',
        })
      } else {
        navigate('/profile', { replace: true })
      }
    } catch (error) {
      setMessage({ text: error.message, tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const emailError = touched.email ? errors.email : undefined
  const passwordError = touched.password ? errors.password : undefined
  const passwordHint = mode === 'signup' && !passwordError

  return (
    <main className="login-page">
      <div className="login-brand">
        <BrandLogo />
      </div>

      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <p className="login-eyebrow">{copy.eyebrow}</p>
          <h1 id="login-title">{copy.title}</h1>
          <p className="login-description">{copy.description}</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete={mode === 'login' ? 'username' : 'email'}
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? '비밀번호를 입력해 주세요' : `${MIN_PASSWORD_LENGTH}자 이상 입력해 주세요`}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : passwordHint ? 'password-hint' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-controls="password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((previous) => !previous)}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  {showPassword ? (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="M3 9s3 6 9 6 9-6 9-6" />
                      <path d="m5 12-2 3m6-1-1 4m7-4 1 4m3-6 2 3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {passwordError && <p id="password-error" className="field-error" aria-live="polite">{passwordError}</p>}
            {passwordHint && <p id="password-hint" className="field-hint">비밀번호는 {MIN_PASSWORD_LENGTH}자 이상이에요.</p>}
          </div>

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? copy.pending : <>{copy.submit} <span aria-hidden="true">↗</span></>}
          </button>
          <p className={`login-message is-${message.tone}`} role="status">{message.text}</p>
        </form>

        <p className="login-switch">
          {copy.switchText}
          <button type="button" onClick={switchMode}>{copy.switchAction}</button>
        </p>
      </section>

      <p className="login-footer">나를 찾는 여정, FindME</p>
      <MockNotice />
    </main>
  )
}
