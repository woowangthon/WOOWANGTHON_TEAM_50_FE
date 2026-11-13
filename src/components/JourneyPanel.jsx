import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.js'
import { getDoneMissionId, setDoneMissionId } from '../lib/mission.js'
import UiIcon from './UiIcon.jsx'
import './JourneyPanel.css'

function Mission({ mission }) {
  const { user } = useAuth()
  const [doneId, setDoneId] = useState(() => getDoneMissionId(user?.id))
  // 반응하다가 가장 끌린 흥미 유형이 바뀌면 미션도 바뀌므로, 완료 여부는 지금 미션 id와 비교합니다.
  const done = doneId === mission.id

  function toggle() {
    const next = done ? null : mission.id
    setDoneMissionId(user?.id, next)
    setDoneId(next)
  }

  return (
    <section className={`journey-mission${done ? ' is-done' : ''}`} aria-labelledby="journey-mission-title">
      <h3 id="journey-mission-title" className="journey-label">
        오늘의 미션
        {mission.trait && <span>{mission.trait}에 맞춘 미션</span>}
      </h3>
      <p className="journey-mission-text">{mission.text}</p>
      <button type="button" className="journey-mission-button" aria-label={done ? '오늘의 미션 완료 취소' : '오늘의 미션 완료'} aria-pressed={done} onClick={toggle}>
        <span className="journey-mission-check"><UiIcon name="check" size={16} /></span>
        완료
      </button>
    </section>
  )
}

function Level({ level, nReactions }) {
  const percent = Math.round(Math.min(1, Math.max(0, level.progress)) * 100)
  return (
    <section className="journey-level" aria-labelledby="journey-level-title">
      <h3 id="journey-level-title" className="journey-label">탐험 레벨</h3>
      <p className="journey-level-name">
        <span className="journey-level-n">Lv.{level.n}</span> {level.name}
      </p>
      <span className="journey-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </span>
      <p className="journey-muted">
        {level.next_at === null
          ? '가장 높은 레벨이에요.'
          : `다음 레벨까지 카드 ${Math.max(0, level.next_at - nReactions)}장 남았어요.`}
      </p>
    </section>
  )
}

const BADGE_ICONS = { first_step: 'footprints', collector: 'bookmark', decider: 'decision', explorer: 'compass', streak3: 'flame', streak7: 'calendar', report: 'sparkles' }

function Badges({ badges }) {
  const earned = badges.filter((badge) => badge.earned).length
  return (
    <section className="journey-badges" aria-labelledby="journey-badges-title">
      <h3 id="journey-badges-title" className="journey-label">
        배지
        <span>{badges.length}개 중 {earned}개</span>
      </h3>
      <ul>
        {badges.map((badge) => (
          <li key={badge.id} className={badge.earned ? 'is-earned' : undefined}>
            <span className="journey-badge-mark"><UiIcon name={BADGE_ICONS[badge.id] || 'award'} /></span>
            <span className="journey-badge-text">
              <strong>{badge.name}</strong>
              <span>{badge.description}</span>
            </span>
            <span className="visually-hidden">{badge.earned ? '(받았어요)' : '(아직 받지 않았어요)'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// 홈 아래쪽의 여정: 오늘의 미션 · 레벨 · 배지 (GET /me/journey)
export default function JourneyPanel({ journey }) {
  return (
    <section className="journey" aria-labelledby="journey-title">
      <h2 id="journey-title">나의 탐험 기록</h2>
      <Mission key={journey.mission.id} mission={journey.mission} />
      <div className="journey-grid">
        <Level level={journey.level} nReactions={journey.n_reactions} />
        <Badges badges={journey.badges} />
      </div>
    </section>
  )
}
