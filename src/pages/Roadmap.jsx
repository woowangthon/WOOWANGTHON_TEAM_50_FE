import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { getRoadmap } from '../api/me.js'
import AppLayout from '../components/AppLayout.jsx'
import './Roadmap.css'

const BACK_LINKS = {
  '/report': '내 리포트로 돌아가기',
  '/saved': '저장한 카드로 돌아가기',
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

// 직업 점수(0~3)와 내 성향 점수(0~1)는 단위가 달라서 직업 점수를 3으로 나눠 같은 막대로 비교합니다.
// 숫자(몇 % 일치)는 보여 주지 않습니다.
function TraitCompare({ traits }) {
  if (!traits.length) return null
  return (
    <section className="roadmap-section" aria-labelledby="roadmap-traits-title">
      <h2 id="roadmap-traits-title">이 직업과 내 성향</h2>
      <p className="roadmap-legend">
        <span className="is-job">이 직업에서 중요한 정도</span>
        <span className="is-me">지금까지 내 성향</span>
      </p>
      <ul className="roadmap-traits">
        {traits.map((trait) => (
          <li key={trait.code}>
            <span className="roadmap-trait-label">{trait.label}</span>
            <span className="roadmap-bars">
              <span className="roadmap-bar is-job" aria-hidden="true">
                <span style={{ width: `${(trait.job_score / 3) * 100}%` }} />
              </span>
              <span className="roadmap-bar is-me" aria-hidden="true">
                <span style={{ width: `${Math.min(1, trait.my_score) * 100}%` }} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Steps({ steps }) {
  if (!steps.length) {
    return <p className="roadmap-empty">이 직업은 아직 안내할 단계가 없어요.</p>
  }
  return (
    <section className="roadmap-section" aria-labelledby="roadmap-steps-title">
      <h2 id="roadmap-steps-title">이 직업에 다가가는 단계</h2>
      <ol className="roadmap-steps">
        {steps.map((step) => (
          <li key={step.key} className="roadmap-step">
            <h3>{step.title}</h3>
            <ul>
              {step.items.map((item, index) => (
                <li key={index}>
                  {item.title && <strong>{item.title}</strong>}
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function Roadmap() {
  const { jobId } = useParams()
  const location = useLocation()
  const [roadmap, setRoadmap] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const from = location.state?.from
  const back = BACK_LINKS[from] ? { to: from, label: BACK_LINKS[from] } : { to: '/report', label: '내 리포트로 돌아가기' }

  useEffect(() => {
    let active = true
    getRoadmap(jobId).then(
      (data) => {
        if (!active) return
        setRoadmap(data)
        setStatus('ready')
      },
      (error) => {
        if (!active) return
        setLoadError(errorMessage(error))
        setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [jobId, reloadKey])

  return (
    <AppLayout>
      <Link to={back.to} className="roadmap-back">{back.label}</Link>

      {status === 'loading' && (
        <div className="page-placeholder"><p role="status">로드맵을 불러오고 있어요.</p></div>
      )}

      {status === 'error' && (
        <div className="page-placeholder">
          <p>{loadError}</p>
          <button
            type="button"
            className="page-secondary"
            onClick={() => {
              setStatus('loading')
              setReloadKey((key) => key + 1)
            }}
          >
            다시 불러오기
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <header className="roadmap-head">
            <p className="roadmap-meta">
              {roadmap.field}
              <span className={roadmap.saved_at ? 'roadmap-saved' : 'roadmap-preview'}>
                {roadmap.saved_at ? `${formatDate(roadmap.saved_at)} 저장한 직업` : '미리 보는 중'}
              </span>
            </p>
            <h1>{roadmap.name} 로드맵</h1>
            {roadmap.summary && <p className="roadmap-summary">{roadmap.summary}</p>}
          </header>

          <TraitCompare traits={roadmap.traits} />
          <Steps steps={roadmap.steps} />

          <p className="roadmap-source">로드맵 내용은 커리어넷 직업 정보를 옮긴 거예요.</p>
        </>
      )}
    </AppLayout>
  )
}
