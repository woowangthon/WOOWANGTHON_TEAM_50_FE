import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { getSaved, unsaveCard } from '../api/me.js'
import AppLayout from '../components/AppLayout.jsx'
import MajorList from '../components/MajorList.jsx'
import './Saved.css'

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function Saved() {
  const [cards, setCards] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [removing, setRemoving] = useState(null)
  const [actionMessage, setActionMessage] = useState('')

  async function remove(card) {
    if (removing) return
    setRemoving(card.card_id)
    setActionMessage('')
    try {
      await unsaveCard(card.card_id)
      setCards((previous) => previous.filter((c) => c.card_id !== card.card_id))
      setActionMessage(`'${card.title}' 저장을 취소했어요.`)
    } catch (error) {
      setActionMessage(errorMessage(error))
    } finally {
      setRemoving(null)
    }
  }

  useEffect(() => {
    let active = true
    getSaved().then(
      (data) => {
        if (!active) return
        setCards(data.cards)
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
        <h1>저장한 카드</h1>
        <p>{status === 'ready' && cards.length > 0 ? `${cards.length}장을 저장했어요. 최근에 저장한 카드가 위에 있어요.` : '오늘의 카드에서 저장한 카드를 모아 봐요.'}</p>
      </header>

      <p className="saved-message" role="status">{actionMessage}</p>

      {status === 'loading' && (
        <div className="page-placeholder"><p role="status">저장한 카드를 불러오고 있어요.</p></div>
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

      {status === 'ready' && cards.length === 0 && (
        <div className="page-placeholder">
          <p>아직 저장한 카드가 없어요. 다시 보고 싶은 직업 카드에서 저장을 눌러 보세요.</p>
          <Link to="/home" className="page-secondary">오늘의 카드 보기</Link>
        </div>
      )}

      {status === 'ready' && cards.length > 0 && (
        <ul className="saved-list">
          {cards.map((card) => (
            <li key={card.card_id}>
              <article className="saved-card" aria-labelledby={`saved-${card.card_id}`}>
                <div className="saved-top">
                  <p className="saved-date">{formatDate(card.saved_at)} 저장</p>
                  <button
                    type="button"
                    className="saved-remove"
                    disabled={Boolean(removing)}
                    onClick={() => remove(card)}
                    aria-label={`${card.title} 저장 취소`}
                  >
                    {removing === card.card_id ? '취소하는 중…' : '저장 취소'}
                  </button>
                </div>
                <h2 id={`saved-${card.card_id}`}>{card.title}</h2>
                <p className="saved-body">{card.body}</p>
                <MajorList majors={card.majors} />
              </article>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  )
}
