import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import RequireInterestSurvey from './auth/RequireInterestSurvey.jsx'
import Home from './pages/Home.jsx'
import JobDetail from './pages/JobDetail.jsx'
import Jobs from './pages/Jobs.jsx'
import Login from './pages/Login.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import Report from './pages/Report.jsx'
import Saved from './pages/Saved.jsx'
import InterestSurvey from './pages/InterestSurvey.jsx'

// 예전 로드맵 주소(/roadmap/:jobId)는 직업 상세로 합쳤습니다. 북마크해 둔 주소도 열리도록 넘겨 줍니다.
function LegacyRoadmap() {
  const { jobId } = useParams()
  const location = useLocation()
  return <Navigate to={`/jobs/${jobId}`} replace state={location.state} />
}

const signedIn = (page) => <RequireAuth><RequireInterestSurvey>{page}</RequireInterestSurvey></RequireAuth>

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/interests" element={<RequireAuth><InterestSurvey /></RequireAuth>} />
          <Route path="/profile" element={signedIn(<ProfileSetup />)} />
          <Route path="/home" element={signedIn(<Home />)} />
          <Route path="/jobs" element={signedIn(<Jobs />)} />
          <Route path="/jobs/:jobId" element={signedIn(<JobDetail />)} />
          <Route path="/report" element={signedIn(<Report />)} />
          <Route path="/saved" element={signedIn(<Saved />)} />
          <Route path="/roadmap/:jobId" element={<LegacyRoadmap />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
