import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.js'
import { getFeed, postReaction } from '../api/feed.js'
import { saveCard, unsaveCard } from '../api/me.js'
import { USE_MOCK } from '../lib/config.js'
import { CARDS as MOCK_CARDS } from '../mocks/data.js'
import { traitLabel } from '../lib/interestTypes.js'
import MajorList from './MajorList.jsx'
import './FeedDeck.css'

const TYPE_LABEL = {
  job_day: '직업의 하루',
  a_vs_b: '둘 중 하나',
  situation: '나라면?',
}

const MOCK_CARD_COUNT = MOCK_CARDS.length

const REACTION_NOTICE = {
  like: '끌려요로 기록했어요.',
  dislike: '별로예요로 기록했어요.',
}

// 하루에 고를 수 있는 카드 수. 서버의 daily_goal(지금 5)을 쓰고, 여정을 아직 못 받았을 때 피드 요청 크기로만 씁니다.
// 백엔드는 daily_goal을 '목표'로만 두지만, 화면에서는 하루 상한으로 써서 다 고르면 오늘의 카드를 닫습니다.
const DAILY_CARDS = 5

// 오늘 고른 카드 수와 하루 장수. today가 없으면(여정 API를 못 불러오면) 이번 묶음의 진행 상황만 보여 줍니다.
function TodayProgress({ today }) {
  const done = today.count >= today.goal
  const percent = done ? 100 : Math.round((today.count / today.goal) * 100)
  return (
    <div className={`feed-today${done ? ' is-reached' : ''}`}>
      <p>
        <span>{done ? '오늘의 카드를 모두 골랐어요' : '오늘 고른 카드'}</span>
        <strong>{Math.min(today.count, today.goal)}/{today.goal}장</strong>
      </p>
      <span className="feed-today-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </span>
    </div>
  )
}

// 오늘 장수를 다 골랐을 때 카드 대신 보여 주는 마무리 화면.
function DoneForToday({ goal, streak, titleRef }) {
  return (
    <div className="feed-done">
      <h3 className="feed-done-title" ref={titleRef} tabIndex={-1}>오늘의 카드 {goal}장을 모두 골랐어요</h3>
      <p className="feed-done-next">
        {streak > 1 ? `${streak}일째 이어 가고 있어요. ` : ''}내일 새 카드 {goal}장이 준비돼요.
      </p>
      <p>그동안 쌓인 내 성향과 어울리는 직업을 살펴보세요.</p>
      <div className="feed-placeholder-actions">
        <Link to="/report" className="feed-secondary">내 리포트 보기</Link>
        <Link to="/jobs" className="feed-secondary">직업 둘러보기</Link>
      </div>
    </div>
  )
}

// 반응 직후 피드백: 기록 안내 + 이번 반응으로 오른 성향. 오늘 장수를 막 채웠으면 축하 문구를 함께 보여 줍니다.
function Feedback({ feedback }) {
  if (!feedback) return null
  return (
    <div className={`feed-feedback${feedback.goalReached ? ' is-goal' : ''}`}>
      {feedback.goalReached && <p className="feed-feedback-goal">오늘의 카드 {feedback.goal}장을 다 골랐어요! 수고했어요.</p>}
      <p className="feed-feedback-line">
        <span>{feedback.message}</span>
        {feedback.gains.length > 0 && (
          <span className="feed-gains">
            <span className="visually-hidden">많이 오른 성향:</span>
            {feedback.gains.map((gain) => (
              <span key={gain.code} className="feed-gain">{traitLabel(gain)} +{gain.delta}</span>
            ))}
          </span>
        )}
      </p>
    </div>
  )
}

// waiting: 오늘 고른 장수를 아직 모를 때 true. 그동안은 카드를 보여 주지 않아 하루 장수를 넘겨 고르지 않게 합니다.
export default function FeedDeck({ today, waiting = false, onReacted, onSaved }) {
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | empty | error
  const [loadError, setLoadError] = useState('')
  const [sending, setSending] = useState(null)
  const [actionError, setActionError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [requestKey, setRequestKey] = useState(0)
  const titleRef = useRef(null)
  const shouldFocus = useRef(false)

  // 하루 장수만큼만 받습니다. 받았지만 고르지 않은 카드는 서버가 다음 요청에 먼저 다시 내려 줍니다.
  useEffect(() => {
    let active = true
    getFeed(DAILY_CARDS).then(
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

  // 오늘 장수를 다 골랐으면 카드 대신 마무리 화면을 보여 줍니다. 여정을 못 불러왔으면(today 없음) 막지 않습니다.
  const doneForToday = Boolean(today) && today.goal > 0 && today.count >= today.goal

  // 반응한 뒤에는 다음 카드 제목(다 골랐으면 마무리 제목)으로 포커스를 옮겨 키보드·스크린리더 사용자가 이어서 볼 수 있게 합니다.
  useEffect(() => {
    if (shouldFocus.current && (status === 'ready' || doneForToday)) {
      titleRef.current?.focus()
      shouldFocus.current = false
    }
  }, [index, status, doneForToday])

  const card = cards[index]

  async function react(reaction, option) {
    if (sending) return
    setSending(option?.id || reaction)
    setActionError('')
    try {
      const result = await postReaction({ impressionId: card.impression_id, reaction, optionId: option?.id })
      setFeedback({
        message: option ? `'${option.label}' 선택을 기록했어요.` : REACTION_NOTICE[reaction],
        gains: result?.gains ?? [],
        goalReached: Boolean(result?.goal_reached),
        goal: result?.daily_goal ?? 0,
        streak: result?.streak ?? 0,
      })
      onReacted?.(result)
      goNext()
    } catch (error) {
      // 이미 사라진 노출이면 그 카드는 건너뜁니다.
      if (error instanceof ApiError && error.code === 'impression_not_found') goNext()
      else setActionError(errorMessage(error))
    } finally {
      setSending(null)
    }
  }

  // 저장은 카드를 넘기지 않습니다. 저장한 뒤에도 끌려요·별로예요를 고를 수 있습니다.
  async function toggleSave() {
    if (sending) return
    const nextSaved = !card.saved
    setSending('save')
    setActionError('')
    try {
      await (nextSaved ? saveCard(card.card_id) : unsaveCard(card.card_id))
      setCards((previous) => previous.map((c, i) => (i === index ? { ...c, saved: nextSaved } : c)))
      setFeedback({
        message: nextSaved ? '저장했어요. 저장한 카드에서 다시 볼 수 있어요.' : '저장을 취소했어요.',
        gains: [],
        goalReached: false,
      })
      onSaved?.()
    } catch (error) {
      setActionError(errorMessage(error))
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
        {today ? (
          today.streak > 0 && <p className="feed-streak">{today.streak}일 연속 탐색 중</p>
        ) : (
          status === 'ready' && !waiting && (
            <p className="feed-progress">
              <span className="visually-hidden">진행 상황: </span>
              {cards.length}장 중 {index + 1}번째
            </p>
          )
        )}
      </div>

      {today && <TodayProgress today={today} />}

      <div role="status">
        <Feedback feedback={feedback} />
      </div>

      {doneForToday && <DoneForToday goal={today.goal} streak={today.streak} titleRef={titleRef} />}

      {!doneForToday && (status === 'loading' || (waiting && status === 'ready')) && (
        <div className="feed-placeholder"><p>카드를 고르고 있어요.</p></div>
      )}

      {!doneForToday && status === 'error' && (
        <div className="feed-placeholder">
          <p>{loadError}</p>
          <button type="button" className="feed-secondary" onClick={reload}>다시 불러오기</button>
        </div>
      )}

      {!doneForToday && status === 'empty' && (
        <div className="feed-placeholder">
          <p>준비된 카드를 모두 봤어요. 새 카드가 생기면 여기에 보여 드릴게요.</p>
          {USE_MOCK && <p className="feed-placeholder-note">연습용 데이터에는 카드가 {MOCK_CARD_COUNT}장뿐이라 금방 끝나요.</p>}
          <div className="feed-placeholder-actions">
            <button type="button" className="feed-secondary" onClick={reload}>새 카드 확인하기</button>
            <Link to="/jobs" className="feed-secondary">직업 둘러보기</Link>
          </div>
        </div>
      )}

      {!doneForToday && !waiting && status === 'ready' && card && (
        <div className="feed-stack" data-remaining={Math.min(cards.length - index - 1, 2)}>
          <article key={card.impression_id} className="feed-card" data-card-type={card.type} aria-labelledby={`card-${card.impression_id}`}>
            <div className="feed-card-top">
              <p className="feed-card-kind">
                {TYPE_LABEL[card.type] || '카드'}
                {card.source === 'random' && <span className="feed-card-tag">새로운 분야</span>}
              </p>
              {card.options.length === 0 && (
                <button
                  type="button"
                  className={`feed-save${card.saved ? ' is-saved' : ''}`}
                  aria-pressed={Boolean(card.saved)}
                  disabled={Boolean(sending)}
                  onClick={toggleSave}
                >
                  {sending === 'save' ? '저장하는 중…' : card.saved ? '저장됨' : '저장'}
                </button>
              )}
            </div>
            <h3 id={`card-${card.impression_id}`} ref={titleRef} tabIndex={-1}>{card.title}</h3>
            <p className="feed-card-body">{card.body}</p>

            {card.reason && (
              <p className="feed-card-reason">
                <span className="feed-card-reason-label">왜 이 카드?</span>
                {card.reason}
              </p>
            )}

            {(card.majors?.length > 0 || card.job_id) && (
              <div className="feed-card-majors">
                <MajorList majors={card.majors} />
                {card.job_id && (
                  <Link to={`/jobs/${card.job_id}`} state={{ from: '/home' }} className="feed-card-job">
                    {card.job_name ? `${card.job_name} 더 알아보기` : '이 직업 더 알아보기'}
                  </Link>
                )}
              </div>
            )}

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

            {actionError && <p className="feed-error" role="alert">{actionError}</p>}
          </article>
        </div>
      )}
    </section>
  )
}
