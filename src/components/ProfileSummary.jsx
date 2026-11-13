import { Link } from 'react-router-dom'
import InterestRadar from './InterestRadar.jsx'
import InterestTypeLink from './InterestTypeLink.jsx'
import { interestScores } from '../lib/interestTypes.js'
import './ProfileSummary.css'

function TraitBar({ trait, rank }) {
  const percent = Math.round(trait.score * 100)
  return (
    <li className="trait">
      <span className="trait-label"><span className="trait-rank">{rank}</span>{trait.label}</span>
      <span className="trait-track" role="img" aria-label={`${trait.label} ${percent}%`}>
        <span className="trait-fill" style={{ width: `${percent}%` }} />
      </span>
    </li>
  )
}

// persona(성향 유형)와 level은 GET /me/journey에서 옵니다. 못 불러왔으면 생략합니다.
export default function ProfileSummary({ me, persona, level }) {
  const topTraits = interestScores(me.traits)
    .filter((trait) => trait.score > 0.005)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return (
    <section className="profile-summary" aria-labelledby="profile-summary-title">
      <div className="profile-summary-head">
        <span className="profile-avatar" aria-hidden="true">{me.nickname.slice(0, 1)}</span>
        <div className="profile-summary-name">
          <h1 id="profile-summary-title">{me.nickname}</h1>
          <p>
            {[level && `Lv.${level.n} ${level.name}`, me.grade && `${me.grade}학년`, `반응한 카드 ${me.n_reactions}장`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Link to="/profile" className="profile-edit">프로필 수정</Link>
      </div>

      {persona && (
        <div className="profile-persona">
          <p className="profile-persona-name">
            <span className="profile-persona-code">{persona.code}형</span>
            {persona.name}
          </p>
          <p className="profile-persona-tagline">{persona.tagline}</p>
        </div>
      )}

      {/* 관심사 설문만 해도 점수가 생기므로, 반응 수가 아니라 점수 유무로 나눕니다. */}
      {topTraits.length === 0 && me.n_reactions === 0 ? (
        <p className="profile-summary-empty">
          아래 카드에 반응할수록 내가 끌리는 분야가 여기에 쌓여요.
        </p>
      ) : topTraits.length === 0 ? (
        <p className="profile-summary-empty">
          아직 뚜렷하게 끌린 성향이 없어요. 마음에 드는 카드에 끌려요를 눌러 보세요.
        </p>
      ) : (
        <>
          <h2 className="profile-summary-subtitle">지금까지 많이 끌린 성향</h2>
          <ol className="trait-list">
            {topTraits.map((trait, index) => <TraitBar key={trait.code} trait={trait} rank={index + 1} />)}
          </ol>
        </>
      )}
      <details className="trait-details">
        <summary className="interest-type-link">
          6가지 흥미 유형 보기<span className="trait-details-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div className="trait-group">
          <h3>흥미 유형</h3>
          <InterestRadar traits={me.traits} />
        </div>
      </details>
      <InterestTypeLink />
    </section>
  )
}
