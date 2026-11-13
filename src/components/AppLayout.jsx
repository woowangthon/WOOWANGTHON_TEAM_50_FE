import AppHeader from './AppHeader.jsx'
import MockNotice from './MockNotice.jsx'
import './AppLayout.css'

// 로그인 후 화면(오늘의 카드, 직업 탐색, AI 동료, 리포트, 저장한 카드, 흥미 유형)의 공통 틀입니다.
// 웹 기준: 위쪽 가로 메뉴 + 최대 1200px 본문. 좁은 화면에서는 각 화면이 한 줄로 정리됩니다.
export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <AppHeader nav />
      <main className="app-main app-container">{children}</main>
      <div className="app-container">
        <MockNotice />
      </div>
    </div>
  )
}
