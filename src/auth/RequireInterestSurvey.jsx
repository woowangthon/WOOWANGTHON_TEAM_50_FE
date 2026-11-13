import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { getInterestSurveyStatus } from '../api/interestSurvey.js'
import PageStatus from '../components/PageStatus.jsx'
import { useAuth } from './AuthContext.js'
import { completeInterestSurvey, getInterestSurvey } from '../lib/interestSurvey.js'

// RequireAuth 안에서 사용합니다. 홈·프로필 주소로 직접 들어와도 설문부터 진행합니다.
// 이 브라우저에 완료 기록이 있으면 바로 통과하고, 없으면 서버(GET /interest-survey)에 물어봅니다.
// 서버가 이미 했다고 하면(다른 기기에서 했거나 브라우저 저장소를 지운 경우) 이 브라우저에도 기록하고 통과합니다.
export default function RequireInterestSurvey({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const localDone = getInterestSurvey(user.id).completed
  const [server, setServer] = useState(null) // { userId, done } | { userId, error }
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (localDone) return undefined
    let active = true
    getInterestSurveyStatus().then(
      (status) => {
        if (!active) return
        if (status.done) {
          try {
            completeInterestSurvey(user.id, status.answers || {})
          } catch {
            // 브라우저에 기록하지 못해도 이번에는 서버 결과대로 통과시킵니다.
          }
        }
        setServer({ userId: user.id, done: Boolean(status.done) })
      },
      (error) => {
        if (active) setServer({ userId: user.id, error: errorMessage(error) })
      },
    )
    return () => {
      active = false
    }
  }, [localDone, user.id, retryKey])

  if (localDone) return children

  const result = server?.userId === user.id ? server : null
  if (!result) return <PageStatus message="설문 기록을 확인하고 있어요." />
  if (result.error) {
    return (
      <PageStatus
        message={result.error}
        action="다시 확인하기"
        onAction={() => {
          setServer(null)
          setRetryKey((key) => key + 1)
        }}
      />
    )
  }
  if (!result.done) return <Navigate to="/interests" replace state={{ from: location.pathname }} />
  return children
}
