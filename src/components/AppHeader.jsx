import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { forgetMe, loadMe } from '../lib/profileCache.js'
import BrandLogo from './BrandLogo.jsx'
import UiIcon from './UiIcon.jsx'
import './AppHeader.css'

const NAV_ITEMS = [
  { to: '/home', label: '오늘의 카드' },
  { to: '/jobs', label: '직업 탐색' },
  { to: '/chat', label: 'AI 동료' },
  { to: '/report', label: '내 리포트' },
  { to: '/saved', label: '저장한 카드' },
  { to: '/interest-types', label: '흥미 유형' },
]

// 오른쪽 프로필 메뉴: 아이콘 + 닉네임을 누르면 '프로필 수정 · 로그아웃'이 열립니다. 바깥을 누르거나 Esc로 닫힙니다.
function ProfileMenu() {
  const { user, signOut } = useAuth()
  const [nickname, setNickname] = useState(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!user) return undefined
    let active = true
    loadMe(user.id).then(
      (me) => {
        if (active) setNickname(me.nickname)
      },
      () => {},
    )
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleSignOut() {
    forgetMe()
    signOut()
  }

  return (
    <div className="app-profile" ref={rootRef}>
      <button
        type="button"
        className="app-profile-button"
        aria-expanded={open}
        aria-controls="app-profile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="app-profile-avatar"><UiIcon name="user" size={20} /></span>
        <span className="app-profile-name">{nickname || '내 계정'}</span>
        <span className="app-profile-chevron"><UiIcon name="chevron-down" size={18} /></span>
      </button>
      <div id="app-profile-menu" className="app-profile-menu" hidden={!open}>
        <Link to="/profile" className="app-profile-item" onClick={() => setOpen(false)}>프로필 수정</Link>
        <button type="button" className="app-profile-item" onClick={handleSignOut}>로그아웃</button>
      </div>
    </div>
  )
}

// 웹: 한 줄에 로고 · 메뉴(지금 화면은 밑줄) · 프로필 메뉴. 좁은 화면: 메뉴를 아래 줄로 내립니다.
// nav를 끄면 메뉴 없이 로고와 프로필 메뉴만 보여 줍니다. (설문처럼 흐름 중간인 화면)
export default function AppHeader({ nav = false }) {
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

        <ProfileMenu />
      </div>
    </header>
  )
}
