import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { getJob } from '../api/jobs.js'
import AppLayout from '../components/AppLayout.jsx'
import MajorList from '../components/MajorList.jsx'
import MatchMeter from '../components/MatchMeter.jsx'
import './JobDetail.css'

// 어디서 들어왔는지(location.state.from)에 따라 돌아가는 링크를 바꿉니다. 모르는 경로면 직업 탐색으로 보냅니다.
const BACK_LABELS = {
  '/home': '오늘의 카드로 돌아가기',
  '/jobs': '직업 탐색으로 돌아가기',
  '/report': '내 리포트로 돌아가기',
  '/saved': '저장한 카드로 돌아가기',
}

function backLink(from) {
  const path = typeof from === 'string' ? from.split('?')[0] : ''
  return BACK_LABELS[path] ? { to: from, label: BACK_LABELS[path] } : { to: '/jobs', label: BACK_LABELS['/jobs'] }
}

const LEVEL_TEXT = ['조금', '조금', '보통', '높음']

// 직업에서의 비중(1~3)을 3으로 나눠 내 성향(0~100%)과 같은 막대로 비교합니다.
function TraitCompare({ traits, hasMatch }) {
  if (!traits.length) return null
  return (
    <section className="roadmap-section" aria-labelledby="job-traits-title">
      <h2 id="job-traits-title">{hasMatch ? '왜 나와 맞을까?' : '이 직업에서 중요한 성향'}</h2>
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
                <span style={{ width: `${(Math.min(3, trait.level) / 3) * 100}%` }} />
              </span>
              <span className="roadmap-bar is-me" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, trait.mine))}%` }} />
              </span>
              <span className="visually-hidden">
                이 직업에서 중요한 정도 {LEVEL_TEXT[trait.level] ?? '높음'}, 내 성향 {trait.mine}%
              </span>
            </span>
            {trait.definition && <p className="roadmap-trait-def">{trait.definition}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Steps({ steps }) {
  if (!steps.length) {
    return <p className="roadmap-empty">이 직업은 아직 안내할 준비 단계가 없어요.</p>
  }
  return (
    <section className="roadmap-section" aria-labelledby="job-steps-title">
      <h2 id="job-steps-title">이 직업에 다가가는 로드맵</h2>
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

function SimilarJobs({ jobs, from }) {
  if (!jobs.length) return null
  return (
    <section className="roadmap-section" aria-labelledby="job-similar-title">
      <h2 id="job-similar-title">비슷한 직업</h2>
      <ul className="job-similar">
        {jobs.map((job) => (
          <li key={job.job_id}>
            <Link to={`/jobs/${job.job_id}`} state={{ from }} className="job-similar-card">
              <strong>{job.name}</strong>
              {job.field && <span className="job-similar-field">{job.field}</span>}
              <MatchMeter match={job.match} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function JobDetailContent({ jobId }) {
  const location = useLocation()
  const [job, setJob] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const from = location.state?.from
  const back = backLink(from)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let active = true
    getJob(jobId).then(
      (data) => {
        if (!active) return
        setJob(data)
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

  const hasMatch = job?.match !== null && job?.match !== undefined

  return (
    <AppLayout>
      <Link to={back.to} className="roadmap-back">{back.label}</Link>

      {status === 'loading' && (
        <div className="page-placeholder"><p role="status">직업 정보를 불러오고 있어요.</p></div>
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
            {job.field && <p className="roadmap-meta">{job.field}</p>}
            <h1>{job.name}</h1>
            {job.summary && <p className="roadmap-summary">{job.summary}</p>}
            {job.majors.length > 0 && (
              <div className="job-majors">
                <MajorList majors={job.majors} />
              </div>
            )}
          </header>

          <section className="job-match" aria-label="나와 맞는 정도">
            {hasMatch ? (
              <>
                <MatchMeter match={job.match} size="large" />
                <p>지금까지 반응한 카드로 계산했어요. 카드에 반응할수록 바뀔 수 있어요.</p>
              </>
            ) : (
              <p>
                오늘의 카드에 반응하면 이 직업이 나와 얼마나 맞는지 알려 드려요.{' '}
                <Link to="/home">카드 보러 가기</Link>
              </p>
            )}
          </section>

          <TraitCompare traits={job.traits} hasMatch={hasMatch} />
          <Steps steps={job.steps} />
          <SimilarJobs jobs={job.similar} from={from} />

          <p className="roadmap-source">로드맵 내용은 커리어넷 직업 정보를 옮긴 거예요.</p>
        </>
      )}
    </AppLayout>
  )
}

// 비슷한 직업으로 옮겨 가면 jobId만 바뀌므로, key로 화면 상태를 새로 시작합니다.
export default function JobDetail() {
  const { jobId } = useParams()
  return <JobDetailContent key={jobId} jobId={jobId} />
}
