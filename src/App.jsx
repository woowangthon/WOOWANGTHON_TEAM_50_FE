import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import RequireInterestSurvey from './auth/RequireInterestSurvey.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import InterestSurvey from './pages/InterestSurvey.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/interests" element={<RequireAuth><InterestSurvey /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><RequireInterestSurvey><ProfileSetup /></RequireInterestSurvey></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><RequireInterestSurvey><Home /></RequireInterestSurvey></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
