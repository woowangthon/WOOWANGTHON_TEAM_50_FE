import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.js'
import { getJourney, getMe } from '../api/me.js'
import AppLayout from '../components/AppLayout.jsx'
import FeedDeck from '../components/FeedDeck.jsx'
import JourneyPanel from '../components/JourneyPanel.jsx'
import PageStatus from '../components/PageStatus.jsx'
import ProfileSummary from '../components/ProfileSummary.jsx'

export default function Home() {
  const [me, setMe] = useState(null)
  const [journey, setJourney] = useState(null)
  const [journeySettled, setJourneySettled] = useState(false) // 성공·실패와 관계없이 첫 응답을 받았는지
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

  // 여정(연속 접속·오늘 장수·레벨·미션·배지)은 못 불러와도 홈은 그대로 씁니다.
  // 다만 오늘 고른 장수로 하루 5장을 막으므로, 첫 응답이 올 때까지는 카드를 보여 주지 않습니다.
  useEffect(() => {
    let active = true
    getJourney().then(
      (data) => {
        if (!active) return
        setJourney(data)
        setJourneySettled(true)
      },
      () => {
        if (active) setJourneySettled(true)
      },
    )
    return () => {
      active = false
    }
  }, [reloadKey])

  const refreshJourney = useCallback(() => {
    getJourney().then(setJourney).catch(() => {})
  }, [])

  // 반응할 때마다 성향 점수와 여정을 다시 받아 옵니다. 실패해도 피드는 계속 쓸 수 있게 조용히 넘깁니다.
  // 오늘 반응 수·연속 일수는 반응 응답에 바로 오므로 먼저 반영해 진행 막대가 바로 움직이게 합니다.
  const handleReacted = useCallback((result) => {
    getMe().then(setMe).catch(() => {})
    if (result && typeof result.today_count === 'number') {
      setJourney((previous) => previous && { ...previous, today_count: result.today_count, streak: result.streak ?? previous.streak })
    }
    refreshJourney()
  }, [refreshJourney])

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

  const today = journey && { count: journey.today_count, goal: journey.daily_goal, streak: journey.streak }

  return (
    <AppLayout>
      <ProfileSummary me={me} persona={journey?.persona} level={journey?.level} />
      <FeedDeck today={today} waiting={!journeySettled} onReacted={handleReacted} onSaved={refreshJourney} />
      {journey && <JourneyPanel journey={journey} />}
    </AppLayout>
  )
}
