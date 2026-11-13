import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.js'
import { getDoneMissionId, setDoneMissionId } from '../lib/mission.js'
import UiIcon from './UiIcon.jsx'
import badgeSheet from '../assets/journey-badges.png'
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
    <section className={`journey-sub journey-mission${done ? ' is-done' : ''}`} aria-labelledby="journey-mission-title">
      <h3 id="journey-mission-title" className="journey-label">
        <span className="journey-dot" aria-hidden="true" />
        오늘의 미션
      </h3>
      <p className="journey-mission-text">{mission.text}</p>
      <button type="button" className="journey-mission-button" aria-label={done ? '오늘의 미션 완료 취소' : '오늘의 미션 완료'} aria-pressed={done} onClick={toggle}>
        <span className="journey-mission-check"><UiIcon name="check" size={14} /></span>
        완료
      </button>
    </section>
  )
}

function Level({ level, nReactions }) {
  const percent = Math.round(Math.min(1, Math.max(0, level.progress)) * 100)
  return (
    <section className="journey-sub journey-level" aria-labelledby="journey-level-title">
      <h3 id="journey-level-title" className="journey-label">탐험 레벨</h3>
      <p className="journey-level-name">Lv.{level.n} {level.name}</p>
      <span className="journey-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </span>
      <p className="journey-muted">
        {level.next_at === null
          ? '가장 높은 레벨이에요.'
          : `다음 레벨까지 카드 ${Math.max(0, level.next_at - nReactions)}장`}
      </p>
    </section>
  )
}

// 원본 투명 PNG의 각 배지를 SVG viewBox로 잘라 표시합니다.
const BADGE_REGIONS = {
  first_step: [7, 7],
  collector: [259, 7],
  decider: [511, 7],
  explorer: [763, 7],
  streak3: [131, 252],
  streak7: [384, 252],
  report: [637, 252],
}
const PREVIEW_COUNT = 3

function BadgeArt({ id }) {
  const region = BADGE_REGIONS[id]
  if (!region) return <UiIcon name="award" size={24} />

  return (
    <svg className="journey-badge-art" viewBox={`${region[0]} ${region[1]} 248 248`} aria-hidden="true" focusable="false">
      <image href={badgeSheet} width="1024" height="512" />
    </svg>
  )
}

// 모은 배지: 평소엔 아이콘 3개(받은 배지 먼저, 모자라면 아직 못 받은 배지를 흐리게)만,
// '탐험 기록 전체 보기'를 누르면 7개 배지의 이름과 조건이 아래에 펼쳐집니다.
function Badges({ badges, open }) {
  const earned = badges.filter((badge) => badge.earned)
  const preview = [...earned, ...badges.filter((badge) => !badge.earned)].slice(0, PREVIEW_COUNT)
  return (
    <section className="journey-sub journey-badges" aria-labelledby="journey-badges-title">
      <h3 id="journey-badges-title" className="journey-label">
        모은 배지
        <span className="journey-count">{earned.length} / {badges.length}</span>
      </h3>
      <ul className="journey-badge-preview">
        {preview.map((badge) => (
          <li key={badge.id} className={badge.earned ? 'is-earned' : undefined} title={badge.name}>
            <BadgeArt id={badge.id} />
            <span className="visually-hidden">{badge.name} {badge.earned ? '(받았어요)' : '(아직 받지 않았어요)'}</span>
          </li>
        ))}
      </ul>

      <ul id="journey-badge-all" className="journey-badge-all" hidden={!open}>
        {badges.map((badge) => (
          <li key={badge.id} className={badge.earned ? 'is-earned' : undefined}>
            <span className="journey-badge-mark"><BadgeArt id={badge.id} /></span>
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

// 홈 오른쪽 '나의 탐험 기록': 오늘의 미션 · 탐험 레벨 · 모은 배지 (GET /me/journey)
export default function JourneyPanel({ journey }) {
  const [allOpen, setAllOpen] = useState(false)
  return (
    <section className="journey home-card" aria-labelledby="journey-title">
      <h2 id="journey-title" className="home-card-title">나의 탐험 기록</h2>
      <div className="journey-stack">
        <Mission key={journey.mission.id} mission={journey.mission} />
        <Level level={journey.level} nReactions={journey.n_reactions} />
        <Badges badges={journey.badges} open={allOpen} />
      </div>
      <button
        type="button"
        className="journey-more"
        aria-expanded={allOpen}
        aria-controls="journey-badge-all"
        onClick={() => setAllOpen((open) => !open)}
      >
        {allOpen ? '탐험 기록 접기' : '탐험 기록 전체 보기'}
        <span className="journey-more-icon"><UiIcon name="chevron-down" size={16} /></span>
      </button>
    </section>
  )
}
