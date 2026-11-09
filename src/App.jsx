import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/profile" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
