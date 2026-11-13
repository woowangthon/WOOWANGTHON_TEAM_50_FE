import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.js'
import { createMe, getMe, updateMe } from '../api/me.js'
import MockNotice from '../components/MockNotice.jsx'
import BrandLogo from '../components/BrandLogo.jsx'
import PageStatus from '../components/PageStatus.jsx'
import './Login.css'
import './ProfileSetup.css'

const NICKNAME_MAX = 20
const GRADES = [
  { value: 1, label: '1학년' },
  { value: 2, label: '2학년' },
  { value: 3, label: '3학년' },
  { value: null, label: '선택 안 함' },
]

const COPY = {
  create: {
    title: '어떻게 불러 드릴까요?',
    description: '카드를 추천할 때 쓰는 기본 정보예요. 나중에 언제든 바꿀 수 있어요.',
    submit: '저장하고 시작하기',
  },
  edit: {
    title: '프로필 수정',
    submit: '변경 내용 저장',
  },
}

function validateNickname(nickname) {
  const trimmed = nickname.trim()
  if (!trimmed) return '닉네임을 입력해 주세요.'
  if (trimmed.length > NICKNAME_MAX) return `닉네임은 ${NICKNAME_MAX}자까지 쓸 수 있어요.`
  return undefined
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [mode, setMode] = useState('create')
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState(null)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [reloadKey, setReloadKey] = useState(0)

  // 프로필이 있으면 수정, 없으면(404) 처음 입력으로 화면을 엽니다.
  useEffect(() => {
    let active = true
    getMe().then(
      (me) => {
        if (!active) return
        setMode('edit')
        setNickname(me.nickname)
        setGrade(me.grade)
        setStatus('ready')
      },
      (error) => {
        if (!active) return
        if (error instanceof ApiError && error.code === 'profile_not_found') {
          setMode('create')
          setStatus('ready')
          return
        }
        setLoadError(errorMessage(error))
        setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [reloadKey])

  function retry() {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }

  if (status === 'loading') return <PageStatus message="프로필을 불러오고 있어요." />
  if (status === 'error') return <PageStatus message={loadError} action="다시 불러오기" onAction={retry} />

  const nicknameError = touched ? validateNickname(nickname) : undefined
  const copy = COPY[mode]

  async function handleSubmit(event) {
    event.preventDefault()
    setTouched(true)
    setMessage('')
    if (validateNickname(nickname)) {
      event.currentTarget.elements.namedItem('nickname').focus()
      return
    }

    const body = { nickname: nickname.trim(), grade }
    setSubmitting(true)
    try {
      if (mode === 'create') {
        try {
          await createMe(body)
        } catch (error) {
          // 다른 탭에서 먼저 만들었다면 수정으로 이어서 저장합니다.
          if (error instanceof ApiError && error.code === 'profile_exists') await updateMe(body)
          else throw error
        }
      } else {
        await updateMe(body)
      }
      navigate('/home', { replace: true })
    } catch (error) {
      setMessage(errorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-brand">
        <BrandLogo />
      </div>

      <section className="login-card" aria-labelledby="profile-title">
        <header className={`login-header${mode === 'edit' ? ' profile-edit-header' : ''}`}>
          <h1 id="profile-title">{copy.title}</h1>
          {copy.description && <p className="login-description">{copy.description}</p>}
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <div className="profile-label-row">
              <label htmlFor="nickname">닉네임</label>
              <span className="profile-counter" aria-hidden="true">
                {nickname.length}/{NICKNAME_MAX}
              </span>
            </div>
            <input
              id="nickname"
              name="nickname"
              type="text"
              autoComplete="nickname"
              maxLength={NICKNAME_MAX}
              placeholder="예: 탐험가 민지"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value.slice(0, NICKNAME_MAX))
                setMessage('')
              }}
              onBlur={() => setTouched(true)}
              required
              aria-invalid={Boolean(nicknameError)}
              aria-describedby={nicknameError ? 'nickname-error' : 'nickname-hint'}
            />
            {nicknameError ? (
              <p id="nickname-error" className="field-error" aria-live="polite">{nicknameError}</p>
            ) : (
              <p id="nickname-hint" className="field-hint">친구들이 부르는 별명을 써도 좋아요.</p>
            )}
          </div>

          <fieldset className="profile-grade">
            <legend>학년</legend>
            <div className="profile-grade-options">
              {GRADES.map((option) => (
                <label key={option.label} className="profile-grade-option">
                  <input
                    type="radio"
                    name="grade"
                    checked={grade === option.value}
                    onChange={() => setGrade(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? '저장하는 중…' : copy.submit}
          </button>
          <p className="login-message is-error" role="status">{message}</p>
        </form>

        {mode === 'edit' && (
          <p className="login-switch">
            <Link to="/home" className="profile-cancel">돌아가기</Link>
          </p>
        )}
      </section>

      <MockNotice />
    </main>
  )
}
