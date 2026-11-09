import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import './AppHeader.css'

export default function AppHeader() {
  const { signOut } = useAuth()

  return (
    <header className="app-header">
      <Link to="/home" className="app-brand" aria-label="FindME 홈">
        <span className="app-brand-symbol" aria-hidden="true">f.</span>
        <span aria-hidden="true">Find<span className="app-brand-accent">ME</span></span>
      </Link>
      <button type="button" className="app-header-action" onClick={signOut}>로그아웃</button>
    </header>
  )
}
