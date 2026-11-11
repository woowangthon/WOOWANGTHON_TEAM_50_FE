import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { getReport } from '../api/me.js'
import AppLayout from '../components/AppLayout.jsx'
import MajorList from '../components/MajorList.jsx'
import './Report.css'

// 리포트는 끌려요 수로만 열립니다. 최소 개수 없이 끌려요를 한 번이라도 누르면 볼 수 있습니다.
const REACTION_LABELS = [
  ['like', '끌려요'],
  ['dislike', '별로예요'],
  ['choose', '선택형 답'],
]

function TraitChips({ traits }) {
  if (!traits.length) return <p className="report-muted">아직 뚜렷하지 않아요.</p>
  return (
    <ul className="report-chips">
      {traits.map((trait) => <li key={trait.code}>{trait.label}</li>)}
    </ul>
  )
}

function LockedReport() {
  return (
    <section className="report-locked" aria-labelledby="report-locked-title">
      <h2 id="report-locked-title">끌려요를 누른 카드가 생기면 리포트가 열려요.</h2>
      <p>마음이 가는 카드에 끌려요를 눌러 보세요. 많이 누를수록 리포트가 더 정확해져요.</p>
      <Link to="/home" className="report-cta">카드 보러 가기</Link>
    </section>
  )
}

function ReadyReport({ report }) {
  return (
    <>
      <section className="report-summary" aria-labelledby="report-summary-title">
        <h2 id="report-summary-title" className="report-summary-source">
          {report.summary_by_ai ? 'AI 진로 동료가 정리한 내 성향' : '반응 기록으로 정리한 내 성향'}
        </h2>
        <p className="report-summary-text">{report.summary}</p>
      </section>

      <section className="report-section report-traits">
        <div>
          <h2>끌린 흥미 유형</h2>
          <TraitChips traits={report.top_interests} />
        </div>
        <div>
          <h2>중요하게 여기는 것</h2>
          <TraitChips traits={report.strengths} />
        </div>
      </section>

      {report.study_tips.length > 0 && (
        <section className="report-section">
          <h2>이렇게 해 보면 좋아요</h2>
          <ul className="report-tips">
            {report.study_tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </section>
      )}

      {report.jobs.length > 0 && (
        <section className="report-section">
          <h2>어울리는 직업</h2>
          <p className="report-muted">끌린 카드와 비슷한 순서예요.</p>
          <ol className="report-jobs">
            {report.jobs.map((job) => (
              <li key={job.job_id} className="report-job">
                <div className="report-job-head">
                  <h3>{job.name}</h3>
                  {job.field && <span>{job.field}</span>}
                </div>
                {job.summary && <p>{job.summary}</p>}
                <MajorList majors={job.majors} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {report.majors.length > 0 && (
        <section className="report-section">
          <h2>살펴볼 만한 학과</h2>
          <ul className="report-chips is-majors">
            {report.majors.map((major) => <li key={major}>{major}</li>)}
          </ul>
        </section>
      )}
    </>
  )
}

export default function Report() {
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    getReport().then(
      (data) => {
        if (!active) return
        setReport(data)
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
  }, [reloadKey])

  return (
    <AppLayout>
      <header className="page-head">
        <h1>내 성향 리포트</h1>
        <p>지금까지 카드에 반응한 기록으로 정리했어요. 반응할수록 내용이 바뀌어요.</p>
      </header>

      {status === 'loading' && (
        <div className="page-placeholder"><p role="status">리포트를 정리하고 있어요. 몇 초 걸릴 수 있어요.</p></div>
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

      {status === 'ready' && (report.ready ? <ReadyReport report={report} /> : <LockedReport />)}

      {status === 'ready' && (
        <section className="report-counts" aria-labelledby="report-counts-title">
          <h2 id="report-counts-title">지금까지 반응한 기록</h2>
          <dl>
            {REACTION_LABELS.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{report.reaction_counts?.[key] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </AppLayout>
  )
}
