import { Navigate, useLocation } from 'react-router-dom'
import PageStatus from '../components/PageStatus.jsx'
import { useAuth } from './AuthContext.js'

// 로그인하지 않은 사용자는 로그인 화면으로 보냅니다.
export default function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageStatus message="로그인 정보를 확인하고 있어요." />
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return children
}
