import AppHeader from './AppHeader.jsx'
import MockNotice from './MockNotice.jsx'
import './AppLayout.css'

// 로그인 후 화면(오늘의 카드, 직업 탐색, 리포트, 저장한 카드)의 공통 틀입니다.
export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <AppHeader nav />
      <main>{children}</main>
      <MockNotice />
    </div>
  )
}
