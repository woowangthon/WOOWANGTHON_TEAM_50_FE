import { interestScores } from '../lib/interestTypes.js'
import './InterestRadar.css'

const CENTER = 160
const RADIUS = 104

function point(index, radius) {
  const angle = (index * Math.PI) / 3 - Math.PI / 2
  return [CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius]
}

function polygonPoints(values) {
  return values.map((value, index) => point(index, RADIUS * value).join(',')).join(' ')
}

function sectorPoints(index) {
  const vertex = point(index, RADIUS)
  const previous = point((index + 5) % 6, RADIUS)
  const next = point((index + 1) % 6, RADIUS)
  const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  return [[CENTER, CENTER], midpoint(previous, vertex), vertex, midpoint(vertex, next)]
    .map((coordinates) => coordinates.join(',')).join(' ')
}

export default function InterestRadar({ traits = [], selectedCode, onSelect, descriptionId, showScores = true }) {
  const scores = interestScores(traits)
  const interactive = typeof onSelect === 'function'
  return (
    <figure className={`interest-radar${interactive ? ' is-interactive' : ''}`}>
      <svg viewBox="0 0 320 320" role={interactive ? 'group' : 'img'} aria-label={interactive ? 'RIASEC 흥미 유형 선택 그래프' : `RIASEC 흥미 유형 그래프. ${scores.map((trait) => `${trait.label} ${Math.round(trait.score * 100)}%`).join(', ')}`}>
        {interactive && scores.map((trait, index) => {
          const [labelX, labelY] = point(index, RADIUS + 30)
          return (
            <g
              key={trait.code}
              className="interest-radar-option"
              role="button"
              tabIndex={0}
              aria-label={`${trait.label} ${trait.code} 유형 설명 보기`}
              aria-pressed={selectedCode === trait.code}
              aria-controls={descriptionId}
              onClick={() => onSelect(trait.code)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(trait.code)
                }
              }}
            >
              <polygon points={sectorPoints(index)} className="interest-radar-sector" />
              <rect x={labelX - 28} y={labelY - 20} width="56" height="42" rx="8" className="interest-radar-label-target" />
              <text x={labelX} y={labelY - 3} textAnchor="middle" className="interest-radar-label">
                {trait.label}
                <tspan x={labelX} dy="16" className="interest-radar-code">{trait.code}</tspan>
              </text>
            </g>
          )
        })}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon key={scale} points={polygonPoints(Array(6).fill(scale))} className="interest-radar-grid" />
        ))}
        {scores.map((trait, index) => {
          const [x, y] = point(index, RADIUS)
          const [labelX, labelY] = point(index, RADIUS + 30)
          return (
            <g key={trait.code}>
              <line x1={CENTER} y1={CENTER} x2={x} y2={y} className="interest-radar-axis" />
              {!interactive && <text x={labelX} y={labelY - 3} textAnchor="middle" className="interest-radar-label">
                {trait.label}
                <tspan x={labelX} dy="16" className="interest-radar-code">{trait.code}</tspan>
              </text>}
            </g>
          )
        })}
        {showScores && <polygon points={polygonPoints(scores.map((trait) => trait.score))} className="interest-radar-area" />}
        {showScores && scores.map((trait, index) => {
          const [cx, cy] = point(index, RADIUS * trait.score)
          return <circle key={trait.code} cx={cx} cy={cy} r="3.5" className="interest-radar-dot" />
        })}
      </svg>
      <figcaption>
        {interactive && <span>영역이나 유형 이름을 누르면 설명이 나와요.</span>}
        {showScores && <span>중심에서 멀수록 더 많이 끌린 흥미 유형이에요.</span>}
      </figcaption>
    </figure>
  )
}
