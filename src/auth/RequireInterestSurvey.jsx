import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'
import { getInterestSurvey } from '../lib/interestSurvey.js'

// RequireAuth 안에서 사용합니다. 홈·프로필 주소로 직접 들어와도 설문부터 진행합니다.
export default function RequireInterestSurvey({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!getInterestSurvey(user.id).completed) {
    return <Navigate to="/interests" replace state={{ from: location.pathname }} />
  }
  return children
}
