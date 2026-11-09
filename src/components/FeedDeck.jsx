import { useEffect, useRef, useState } from 'react'
import { ApiError, errorMessage } from '../api/client.js'
import { getFeed, postReaction } from '../api/feed.js'
import './FeedDeck.css'

const TYPE_LABEL = {
  job_day: '직업의 하루',
  a_vs_b: '둘 중 하나',
  situation: '나라면?',
}

const REACTION_NOTICE = {
  like: '끌려요로 기록했어요.',
  dislike: '별로예요로 기록했어요.',
  save: '저장했어요.',
  pass: '넘겼어요.',
}

export default function FeedDeck({ onReacted }) {
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | empty | error
  const [loadError, setLoadError] = useState('')
  const [sending, setSending] = useState(null)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [requestKey, setRequestKey] = useState(0)
  const titleRef = useRef(null)
  const shouldFocus = useRef(false)

  useEffect(() => {
    let active = true
    getFeed(10).then(
      ({ cards: next }) => {
        if (!active) return
        setCards(next)
        setIndex(0)
        setStatus(next.length ? 'ready' : 'empty')
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
  }, [requestKey])

  function reload() {
    setStatus('loading')
    setRequestKey((key) => key + 1)
  }

  // 반응한 뒤에는 다음 카드 제목으로 포커스를 옮겨 키보드·스크린리더 사용자가 이어서 볼 수 있게 합니다.
  useEffect(() => {
    if (shouldFocus.current && status === 'ready') {
      titleRef.current?.focus()
      shouldFocus.current = false
    }
  }, [index, status])

  const card = cards[index]

  async function react(reaction, option) {
    if (sending) return
    setSending(option?.id || reaction)
    setActionError('')
    try {
      await postReaction({ impressionId: card.impression_id, reaction, optionId: option?.id })
      setNotice(option ? `'${option.label}' 선택을 기록했어요.` : REACTION_NOTICE[reaction])
      onReacted?.()
      goNext()
    } catch (error) {
      // 이미 사라진 노출이면 그 카드는 건너뜁니다.
      if (error instanceof ApiError && error.code === 'impression_not_found') goNext()
      else setActionError(errorMessage(error))
    } finally {
      setSending(null)
    }
  }

  function goNext() {
    shouldFocus.current = true
    if (index + 1 < cards.length) {
      setIndex(index + 1)
    } else {
      reload()
    }
  }

  return (
    <section className="feed" aria-labelledby="feed-title">
      <div className="feed-head">
        <h2 id="feed-title">오늘의 카드</h2>
        {status === 'ready' && (
          <p className="feed-progress">
            <span className="visually-hidden">진행 상황: </span>
            {cards.length}장 중 {index + 1}번째
          </p>
        )}
      </div>

      <p className="visually-hidden" role="status">{notice}</p>

      {status === 'loading' && <div className="feed-placeholder"><p>카드를 고르고 있어요.</p></div>}

      {status === 'error' && (
        <div className="feed-placeholder">
          <p>{loadError}</p>
          <button type="button" className="feed-secondary" onClick={reload}>다시 불러오기</button>
        </div>
      )}

      {status === 'empty' && (
        <div className="feed-placeholder">
          <p>준비된 카드를 모두 봤어요. 새 카드가 생기면 여기에 보여 드릴게요.</p>
          <button type="button" className="feed-secondary" onClick={reload}>새 카드 확인하기</button>
        </div>
      )}

      {status === 'ready' && card && (
        <div className="feed-stack" data-remaining={Math.min(cards.length - index - 1, 2)}>
          <article key={card.impression_id} className="feed-card" aria-labelledby={`card-${card.impression_id}`}>
            <p className="feed-card-kind">
              {TYPE_LABEL[card.type] || '카드'}
              {card.source === 'random' && <span className="feed-card-tag">새로운 분야</span>}
            </p>
            <h3 id={`card-${card.impression_id}`} ref={titleRef} tabIndex={-1}>{card.title}</h3>
            <p className="feed-card-body">{card.body}</p>

            {card.options.length > 0 ? (
              <div className="feed-options" role="group" aria-label="선택지">
                {card.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="feed-option"
                    disabled={Boolean(sending)}
                    onClick={() => react('choose', option)}
                  >
                    {sending === option.id ? '기록하는 중…' : option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="feed-reactions" role="group" aria-label="이 카드에 반응하기">
                <button type="button" className="feed-reaction" disabled={Boolean(sending)} onClick={() => react('dislike')}>
                  {sending === 'dislike' ? '기록하는 중…' : '별로예요'}
                </button>
                <button type="button" className="feed-reaction is-primary" disabled={Boolean(sending)} onClick={() => react('like')}>
                  {sending === 'like' ? '기록하는 중…' : '끌려요'}
                </button>
              </div>
            )}

            <div className="feed-card-foot">
              {card.options.length === 0 && (
                <button type="button" className="feed-text-button" disabled={Boolean(sending)} onClick={() => react('save')}>
                  {sending === 'save' ? '저장하는 중…' : '저장'}
                </button>
              )}
              <button type="button" className="feed-text-button" disabled={Boolean(sending)} onClick={() => react('pass')}>
                {sending === 'pass' ? '넘기는 중…' : '넘기기'}
              </button>
            </div>

            {actionError && <p className="feed-error" role="alert">{actionError}</p>}
          </article>
        </div>
      )}
    </section>
  )
}
