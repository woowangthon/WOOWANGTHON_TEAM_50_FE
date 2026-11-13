import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getMe } from '../api/me.js'
import AppLayout from '../components/AppLayout.jsx'
import InterestRadar from '../components/InterestRadar.jsx'
import { INTEREST_TYPES } from '../lib/interestTypes.js'
import './InterestTypes.css'

export default function InterestTypes() {
  const location = useLocation()
  const from = location.state?.from
  const back = typeof from === 'string' && /^\/(home|report|jobs(?:\/[^/?#]+)?)(?:\?[^#]*)?$/.test(from) ? from : '/home'
  const [selectedCode, setSelectedCode] = useState('R')
  const [traits, setTraits] = useState([])
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const selected = INTEREST_TYPES.find((type) => type.code === selectedCode)

  useEffect(() => {
    let active = true
    getMe().then(
      (me) => {
        if (!active) return
        setTraits(me.traits)
        setStatus('ready')
      },
      () => {
        if (active) setStatus('error')
      },
    )
    return () => { active = false }
  }, [reloadKey])

  return (
    <AppLayout>
      <Link to={back} state={location.state?.returnState} className="roadmap-back">← 돌아가기</Link>
      <header className="page-head">
        <h1>흥미 유형</h1>
        <p>RIASEC은 좋아하는 활동을 6가지 영역으로 살펴보는 방법이에요. 여러 유형에 함께 끌릴 수 있고, 경험에 따라 달라질 수 있어요.</p>
      </header>
      {/* 웹: 왼쪽 그래프에서 고르면 오른쪽에 설명. 좁은 화면: 그래프 아래에 설명. */}
      <div className="interest-types-layout">
        <section className="interest-explorer" aria-label="6가지 흥미 유형 살펴보기">
          <InterestRadar traits={traits} selectedCode={selectedCode} onSelect={setSelectedCode} descriptionId="interest-type-description" showScores={status === 'ready'} />
          {status === 'loading' && <p className="interest-score-status" role="status">내 흥미 점수를 불러오고 있어요.</p>}
          {status === 'error' && (
            <div className="interest-score-status" role="status">
              <p>내 흥미 점수를 불러오지 못했어요. 유형별 설명은 계속 살펴볼 수 있어요.</p>
              <button type="button" className="page-secondary" onClick={() => { setStatus('loading'); setReloadKey((key) => key + 1) }}>다시 불러오기</button>
            </div>
          )}
        </section>
        <section id="interest-type-description" className="interest-type-description" aria-live="polite" aria-atomic="true" aria-labelledby="selected-interest-title">
          <span className="interest-type-code" aria-hidden="true">{selected.code}</span>
          <div>
            <h2 id="selected-interest-title">{selected.label}</h2>
            <h3>{selected.activity}</h3>
            <p>{selected.description}</p>
            <p className="interest-type-example">{selected.example}</p>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
