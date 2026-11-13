import AppHeader from './AppHeader.jsx'
import MockNotice from './MockNotice.jsx'
import './AppLayout.css'

// 로그인 후 화면(오늘의 카드, 직업 탐색, AI 동료, 리포트, 저장한 카드)의 공통 틀입니다.
// wide: 대화 목록 사이드바가 있는 AI 동료 화면처럼 넓은 화면이 필요할 때 켭니다.
export default function AppLayout({ children, wide = false }) {
  return (
    <div className={`app-layout${wide ? ' is-wide' : ''}`}>
      <AppHeader nav />
      <main>{children}</main>
      <MockNotice />
    </div>
  )
}
