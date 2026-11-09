import { USE_MOCK } from '../lib/config.js'
import './MockNotice.css'

// 목업 모드일 때만 보이는 안내. 발표·배포 전에는 .env.local에 Supabase 키를 넣어 실제 서버로 연결합니다.
export default function MockNotice() {
  if (!USE_MOCK) return null
  return (
    <p className="mock-notice">
      지금은 연습용 데이터로 보고 있어요. 입력한 내용은 이 브라우저에만 저장돼요.
    </p>
  )
}
