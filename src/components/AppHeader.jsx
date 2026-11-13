import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import './AppHeader.css'

const NAV_ITEMS = [
  { to: '/home', label: '오늘의 카드' },
  { to: '/jobs', label: '직업 탐색' },
  { to: '/report', label: '내 리포트' },
  { to: '/saved', label: '저장한 카드' },
]

// nav를 켜면 화면 이동 메뉴를 함께 보여 줍니다. (설문처럼 흐름 중간인 화면에서는 끕니다)
export default function AppHeader({ nav = false }) {
  const { signOut } = useAuth()

  return (
    <header className="app-header">
      <div className="app-header-row">
        <Link to="/home" className="app-brand" aria-label="FindME 홈">
          <span className="app-brand-symbol" aria-hidden="true">f.</span>
          <span aria-hidden="true">Find<span className="app-brand-accent">ME</span></span>
        </Link>
        <button type="button" className="app-header-action" onClick={signOut}>로그아웃</button>
      </div>

      {nav && (
        <nav className="app-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="app-nav-link">{item.label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
