import { useEffect, useState } from 'react'
import { onSlowRequest } from '../api/client.js'
import './ServerWakeNotice.css'

// 배포 서버가 잠들어 있으면 첫 요청이 50초쯤 걸립니다. 요청이 오래 걸릴 때만 화면 아래에 안내를 띄웁니다.
export default function ServerWakeNotice() {
  const [slow, setSlow] = useState(false)
  useEffect(() => onSlowRequest(setSlow), [])

  return (
    <div className="server-wake" role="status">
      {slow && (
        <p className="server-wake-toast">
          <span className="server-wake-dot" aria-hidden="true" />
          서버를 깨우고 있어요. 처음 접속하면 1분쯤 걸릴 수 있어요.
        </p>
      )}
    </div>
  )
}
