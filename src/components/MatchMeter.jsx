import './MatchMeter.css'

// 직업 적합도(0~100). 성향이 아직 없어 match가 null이면 아무것도 그리지 않습니다.
// 적합도는 지금까지 반응한 카드로 계산한 '경향'이라, 화면에서도 "나와 맞는 정도"로만 부릅니다.
export default function MatchMeter({ match, size = 'small' }) {
  if (match === null || match === undefined) return null
  const value = Math.min(100, Math.max(0, Math.round(match)))
  return (
    <span className={`match-meter is-${size}`}>
      <span className="match-meter-text">
        나와 맞는 정도 <strong>{value}%</strong>
      </span>
      <span className="match-meter-track" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </span>
    </span>
  )
}
