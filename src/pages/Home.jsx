import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.js'
import { getMe } from '../api/me.js'
import AppHeader from '../components/AppHeader.jsx'
import FeedDeck from '../components/FeedDeck.jsx'
import MockNotice from '../components/MockNotice.jsx'
import PageStatus from '../components/PageStatus.jsx'
import ProfileSummary from '../components/ProfileSummary.jsx'
import './Home.css'

export default function Home() {
  const [me, setMe] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | no-profile | error
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    getMe().then(
      (data) => {
        if (!active) return
        setMe(data)
        setStatus('ready')
      },
      (error) => {
        if (!active) return
        if (error instanceof ApiError && error.code === 'profile_not_found') {
          setStatus('no-profile')
          return
        }
        setLoadError(errorMessage(error))
        setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [reloadKey])

  // 반응할 때마다 성향 점수를 다시 받아 옵니다. 실패해도 피드는 계속 쓸 수 있게 조용히 넘깁니다.
  const refreshMe = useCallback(() => {
    getMe().then(setMe).catch(() => {})
  }, [])

  if (status === 'loading') return <PageStatus message="내 정보를 불러오고 있어요." />
  if (status === 'no-profile') return <Navigate to="/profile" replace />
  if (status === 'error') {
    return (
      <PageStatus
        message={loadError}
        action="다시 불러오기"
        onAction={() => {
          setStatus('loading')
          setReloadKey((key) => key + 1)
        }}
      />
    )
  }

  return (
    <div className="home">
      <AppHeader />
      <main>
        <ProfileSummary me={me} />
        <FeedDeck onReacted={refreshMe} />
      </main>
      <MockNotice />
    </div>
  )
}
