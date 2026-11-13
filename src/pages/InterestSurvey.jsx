import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { submitInterestSurvey } from '../api/interestSurvey.js'
import { useAuth } from '../auth/AuthContext.js'
import AppHeader from '../components/AppHeader.jsx'
import SurveyFace from '../components/SurveyFace.jsx'
import {
  INTEREST_OPTIONS,
  INTEREST_QUESTIONS,
  SURVEY_VERSION,
  completeInterestSurvey,
  firstUnanswered,
  getInterestSurvey,
  saveInterestDraft,
} from '../lib/interestSurvey.js'
import './InterestSurvey.css'

const PAGE_SIZE = 4
const PAGE_COUNT = Math.ceil(INTEREST_QUESTIONS.length / PAGE_SIZE)

// 계정이 바뀌면 진행 중이던 다른 계정의 답변도 화면에서 초기화합니다.
export default function InterestSurvey() {
  const { user } = useAuth()
  return <SurveyForm key={user.id} userId={user.id} />
}

function SurveyForm({ userId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [saved] = useState(() => getInterestSurvey(userId))
  const [answers, setAnswers] = useState(saved.answers)
  const [step, setStep] = useState(() => {
    const index = INTEREST_QUESTIONS.findIndex(({ id }) => !saved.answers[id])
    return index === -1 ? PAGE_COUNT - 1 : Math.floor(index / PAGE_SIZE)
  })
  const [missingId, setMissingId] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef(null)
  const questionRefs = useRef({})
  const questions = INTEREST_QUESTIONS.slice(step * PAGE_SIZE, (step + 1) * PAGE_SIZE)
  const answeredCount = Object.keys(answers).length
  const destination = ['/profile', '/home'].includes(location.state?.from)
    ? location.state.from : '/home'

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (missingId) questionRefs.current[missingId]?.focus()
  }, [step, missingId])

  if (saved.completed) return <Navigate to={destination} replace />

  function selectAnswer(questionId, value) {
    const next = { ...answers, [questionId]: value }
    setAnswers(next)
    if (missingId === questionId) setMissingId(null)
    try {
      saveInterestDraft(userId, next)
      setMessage('')
    } catch {
      setMessage('임시 저장을 하지 못했어요. 새로고침하면 지금 고른 답변이 사라질 수 있어요.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const missing = step === PAGE_COUNT - 1
      ? firstUnanswered(answers)
      : questions.find(({ id }) => !answers[id])
    if (missing) {
      setMissingId(missing.id)
      setMessage('아직 답하지 않은 질문이 있어요. 마음이 가는 답변을 하나 골라주세요.')
      setStep(Math.floor(INTEREST_QUESTIONS.findIndex(({ id }) => id === missing.id) / PAGE_SIZE))
      // 같은 질문에서 다시 제출해도 포커스를 안내합니다.
      questionRefs.current[missing.id]?.focus()
      return
    }
    if (step < PAGE_COUNT - 1) {
      setMissingId(null)
      setMessage('')
      setStep(step + 1)
      return
    }
    // 서버에 먼저 보내 흥미 점수에 반영하고, 성공하면 이 브라우저에도 완료로 기록합니다.
    setSubmitting(true)
    setMessage('')
    try {
      await submitInterestSurvey({ version: SURVEY_VERSION, answers })
    } catch (error) {
      setMessage(errorMessage(error))
      setSubmitting(false)
      return
    }
    try {
      completeInterestSurvey(userId, answers)
      navigate(destination, { replace: true })
    } catch (error) {
      setMessage(error.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="interest-page">
      <AppHeader />
      <main className="interest-main">
        <header className="interest-intro">
          <p className="interest-eyebrow">나를 알아가는 첫걸음</p>
          <h1>어떤 활동에 마음이 가나요?</h1>
          <p>잘하는지는 상관없어요.<br />표정을 눌러 지금 해보고 싶은 정도를 골라주세요.</p>
        </header>

        <div className="interest-progress">
          <div>
            <span>관심사 알아보기</span>
            <span aria-live="polite">{answeredCount} / {INTEREST_QUESTIONS.length}개 답변</span>
          </div>
          <progress value={answeredCount} max={INTEREST_QUESTIONS.length} aria-label="전체 질문 응답 진행률" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <h2 className="interest-step" ref={headingRef} tabIndex={-1}>
            <span>{step + 1} / {PAGE_COUNT}단계</span> 이런 활동, 얼마나 해보고 싶나요?
          </h2>
          <div className="interest-questions">
            {questions.map((question, index) => (
              <fieldset
                key={question.id}
                className={`interest-question${missingId === question.id ? ' is-missing' : ''}`}
                ref={(element) => { questionRefs.current[question.id] = element }}
                tabIndex={-1}
                aria-describedby={missingId === question.id ? 'interest-message' : undefined}
              >
                <legend>
                  <span className="interest-number">{String(step * PAGE_SIZE + index + 1).padStart(2, '0')}</span>
                  {question.text}
                </legend>
                <div className="interest-options">
                  {INTEREST_OPTIONS.map((option) => (
                    <label className="interest-option" key={option.value} title={option.label}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        aria-label={option.label}
                        checked={answers[question.id] === option.value}
                        onChange={() => selectAnswer(question.id, option.value)}
                      />
                      <SurveyFace value={option.value} />
                      <span className="interest-option-caption" aria-hidden="true">{option.shortLabel}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <p id="interest-message" className="interest-message" role="alert">{message}</p>
          <div className="interest-actions">
            <button
              type="button"
              className="interest-back"
              disabled={step === 0}
              onClick={() => {
                setMissingId(null)
                setMessage('')
                setStep(step - 1)
              }}
            >이전</button>
            <button type="submit" className="interest-next" disabled={submitting}>
              {submitting ? '저장하는 중…' : step === PAGE_COUNT - 1 ? '답변 저장하고 계속하기' : '다음으로'}
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="interest-note">중간에 나갔다 와도 이어서 할 수 있어요. 마지막에 저장하면 내 카드 추천에 반영돼요.</p>
        </form>
      </main>
    </div>
  )
}
