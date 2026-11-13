import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import BrandLogo from './BrandLogo.jsx'
import './AppHeader.css'

const NAV_ITEMS = [
  { to: '/home', label: '오늘의 카드' },
  { to: '/jobs', label: '직업 탐색' },
  { to: '/chat', label: 'AI 동료' },
  { to: '/report', label: '내 리포트' },
  { to: '/saved', label: '저장한 카드' },
  { to: '/interest-types', label: '흥미 유형' },
]

// 웹에서는 한 줄에 로고 · 메뉴 · 로그아웃을 두고, 좁은 화면에서는 메뉴를 아래 줄로 내립니다.
// nav를 끄면 메뉴 없이 로고와 로그아웃만 보여 줍니다. (설문처럼 흐름 중간인 화면)
export default function AppHeader({ nav = false }) {
  const { signOut } = useAuth()

  return (
    <header className={`app-header${nav ? ' has-nav' : ''}`}>
      <div className="app-header-inner app-container">
        <Link to="/home" className="app-brand" aria-label="FindME 홈">
          <BrandLogo decorative />
        </Link>

        {nav && (
          <nav className="app-nav" aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className="app-nav-link">{item.label}</NavLink>
            ))}
          </nav>
        )}

        <button type="button" className="app-header-action" onClick={signOut}>로그아웃</button>
      </div>
    </header>
  )
}
