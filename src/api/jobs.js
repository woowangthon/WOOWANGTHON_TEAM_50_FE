import { USE_MOCK } from '../lib/config.js'
import * as mock from '../mocks/mockBackend.js'
import { apiFetch } from './client.js'

// 직업 목록. 내 성향과 잘 맞는 순서이고, field로 분야를 거릅니다. limit은 1~100 (기본 30).
// 응답: { fields: [분야 이름], jobs: [JobSummary] }
// JobSummary: { job_id, name, field, summary, match }
// match는 적합도 0~100입니다. 성향이 아직 없으면 null이고, 이때 목록은 직업 코드 순입니다.
export function getJobs({ field = null, limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (field) params.set('field', field)
  return USE_MOCK ? mock.getJobs({ field, limit }) : apiFetch(`/jobs?${params}`)
}

// 직업 상세. 응답: { job_id, name, field, summary, majors[], match, traits[], steps[], similar: [JobSummary] }
// traits: 이 직업의 핵심 성향, 비중 높은 순 [{ code, label, group, definition, level(직업에서의 비중 1~3), mine(내 성향 0~100) }]
// steps: 커리어넷 원문 준비 단계 [{ key, title, items: [{ title | null, detail }] }] (GET /me/roadmap/{job_id}와 같음)
// 없는 직업이면 ApiError(404, 'job_not_found')
export function getJob(jobId) {
  return USE_MOCK ? mock.getJob(jobId) : apiFetch(`/jobs/${encodeURIComponent(jobId)}`)
}
