import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { getJobs } from '../api/jobs.js'
import AppLayout from '../components/AppLayout.jsx'
import MatchMeter from '../components/MatchMeter.jsx'
import './Jobs.css'

const PAGE = 30
const MAX_LIMIT = 100 // 백엔드 limit 상한

export default function Jobs() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const field = searchParams.get('field') || ''
  const [limit, setLimit] = useState(PAGE)
  const [reloadKey, setReloadKey] = useState(0)
  // 분야를 바꾸거나 더 볼 때 목록이 비었다가 다시 그려지지 않도록, 마지막으로 받은 결과를 그대로 두고 요청 키로 진행 중인지 판단합니다.
  const [data, setData] = useState(null) // { key, fields, jobs }
  const [failure, setFailure] = useState(null) // { key, message }
  const requestKey = `${field}|${limit}|${reloadKey}`

  useEffect(() => {
    let active = true
    const key = `${field}|${limit}|${reloadKey}`
    getJobs({ field: field || null, limit }).then(
      (result) => {
        if (!active) return
        setData({ key, fields: result.fields, jobs: result.jobs })
        setFailure(null)
      },
      (error) => {
        if (active) setFailure({ key, message: errorMessage(error) })
      },
    )
    return () => {
      active = false
    }
  }, [field, limit, reloadKey])

  const failed = failure?.key === requestKey
  const busy = !failed && data?.key !== requestKey
  const jobs = data?.jobs ?? []
  const noMatch = jobs.length > 0 && jobs.every((job) => job.match === null)
  const canLoadMore = jobs.length >= limit && limit < MAX_LIMIT
  const from = `/jobs${location.search}`

  function changeField(event) {
    const next = event.target.value
    setLimit(PAGE)
    setSearchParams(next ? { field: next } : {})
  }

  function retry() {
    setReloadKey((key) => key + 1)
  }

  return (
    <AppLayout>
      <header className="page-head">
        <h1>직업 탐색</h1>
        <p>내 성향과 잘 맞는 순서로 보여 드려요. 카드에 반응할수록 순서가 바뀌어요.</p>
      </header>

      {data && (
        <div className="jobs-filter">
          <label htmlFor="jobs-field">분야</label>
          <select id="jobs-field" value={field} onChange={changeField}>
            <option value="">전체 분야</option>
            {data.fields.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      )}

      {!data && !failed && (
        <div className="page-placeholder"><p role="status">직업을 불러오고 있어요.</p></div>
      )}

      {failed && (
        <div className={data ? 'jobs-inline-error' : 'page-placeholder'}>
          <p role="alert">{failure.message}</p>
          <button type="button" className="page-secondary" onClick={retry}>다시 불러오기</button>
        </div>
      )}

      {data && (
        <>
          {noMatch && (
            <p className="jobs-notice">
              아직 내 성향이 없어서 기본 순서로 보여요. <Link to="/home">오늘의 카드</Link>에 반응하면 나와 맞는 순서로 바뀌어요.
            </p>
          )}

          <p className="visually-hidden" role="status">{busy ? '직업을 불러오고 있어요.' : ''}</p>

          {jobs.length === 0 ? (
            <div className="page-placeholder"><p>이 분야에는 아직 보여 줄 직업이 없어요.</p></div>
          ) : (
            <ol className={`jobs-list${busy ? ' is-busy' : ''}`} aria-busy={busy}>
              {jobs.map((job) => (
                <li key={job.job_id}>
                  <Link to={`/jobs/${job.job_id}`} state={{ from }} className="jobs-item">
                    <span className="jobs-item-head">
                      <strong>{job.name}</strong>
                      {job.field && <span>{job.field}</span>}
                    </span>
                    {job.summary && <span className="jobs-item-summary">{job.summary}</span>}
                    <MatchMeter match={job.match} />
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {canLoadMore && (
            <button
              type="button"
              className="page-secondary jobs-more"
              disabled={busy}
              onClick={() => setLimit((value) => Math.min(value + PAGE, MAX_LIMIT))}
            >
              {busy ? '불러오는 중…' : '직업 더 보기'}
            </button>
          )}
        </>
      )}
    </AppLayout>
  )
}
