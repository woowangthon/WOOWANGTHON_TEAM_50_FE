import InterestTypeLink from './InterestTypeLink.jsx'
import { interestScores } from '../lib/interestTypes.js'
import './ProfileSummary.css'

// 홈 왼쪽 '나의 탐색 프로필': 나(아바타·닉네임·레벨) → 성향 유형 → 많이 끌린 흥미 유형 3개(%) → 흥미 유형 화면 링크.
// persona(성향 유형)와 level은 GET /me/journey에서 옵니다. 못 불러왔으면 생략합니다.
// 프로필 수정은 위쪽 헤더의 프로필 메뉴에 있습니다.
export default function ProfileSummary({ me, persona, level }) {
  const topTraits = interestScores(me.traits)
    .filter((trait) => trait.score > 0.005)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return (
    <section className="profile-card home-card" aria-labelledby="profile-card-title">
      <h2 id="profile-card-title" className="home-card-title">나의 탐색 프로필</h2>

      <div className="profile-who">
        <span className="profile-avatar" aria-hidden="true">{me.nickname.slice(0, 1)}</span>
        <div className="profile-who-text">
          <p className="profile-nickname">{me.nickname}</p>
          <p className="profile-level">{level ? `Lv.${level.n} ${level.name}` : `반응한 카드 ${me.n_reactions}장`}</p>
        </div>
      </div>

      <div className="profile-persona">
        {persona ? (
          <>
            <p className="profile-persona-name">{persona.name}</p>
            <p className="profile-persona-tagline">{persona.tagline}</p>
          </>
        ) : (
          <p className="profile-empty">카드에 반응하면 나의 성향 유형이 생겨요.</p>
        )}

        {/* 관심사 설문만 해도 점수가 생기므로, 반응 수가 아니라 점수 유무로 나눕니다. */}
        {topTraits.length > 0 ? (
          <ol className="profile-traits" aria-label="많이 끌린 흥미 유형">
            {topTraits.map((trait) => {
              const percent = Math.round(trait.score * 100)
              return (
                <li key={trait.code}>
                  <span className="profile-trait-label">{trait.label}</span>
                  <span className="profile-trait-track" aria-hidden="true">
                    <span style={{ width: `${percent}%` }} />
                  </span>
                  <span className="profile-trait-value">{percent}%</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="profile-empty">마음에 드는 카드에 끌려요를 누르면 끌린 흥미 유형이 여기에 쌓여요.</p>
        )}
      </div>

      <div className="profile-card-foot">
        <InterestTypeLink>내 흥미 자세히 보기</InterestTypeLink>
      </div>
    </section>
  )
}
