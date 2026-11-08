import { useEffect } from 'react'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  // 각 화면은 일반 링크로 이동하므로 새로고침과 브라우저 뒤로가기도 동작합니다.
  const isSignup = window.location.pathname.replace(/\/+$/, '') === '/signup'

  useEffect(() => {
    document.title = `FindME | ${isSignup ? '회원가입' : '로그인'}`
  }, [isSignup])

  return isSignup ? <Signup /> : <Login />
}

export default App
