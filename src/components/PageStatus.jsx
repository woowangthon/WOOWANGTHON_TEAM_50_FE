import './PageStatus.css'

// 화면 전체를 채우는 로딩·오류 안내. action이 있으면 버튼을 함께 보여 줍니다.
export default function PageStatus({ message, action, onAction }) {
  return (
    <main className="page-status">
      <p role="status">{message}</p>
      {action && (
        <button type="button" onClick={onAction}>{action}</button>
      )}
    </main>
  )
}
