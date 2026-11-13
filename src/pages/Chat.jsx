import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import { sendChat } from '../api/coach.js'
import { useAuth } from '../auth/AuthContext.js'
import AppLayout from '../components/AppLayout.jsx'
import ReadableText from '../components/ReadableText.jsx'
import UiIcon from '../components/UiIcon.jsx'
import {
  CHAT_STARTERS,
  MAX_USER_CHARS,
  chatTitle,
  loadChats,
  newId,
  saveChats,
  toChatPayload,
} from '../lib/chatHistory.js'
import './Chat.css'

function formatWhen(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

// 계정이 바뀌면 다른 계정의 대화 목록이 남지 않도록 화면을 새로 시작합니다.
export default function Chat() {
  const { user } = useAuth()
  return <ChatScreen key={user.id} userId={user.id} />
}

function ChatItem({ chat, active, confirming, onOpen, onPin, onAskDelete, onDelete, onCancel }) {
  return (
    <li className={`chat-item${active ? ' is-active' : ''}`}>
      {confirming ? (
        <div className="chat-item-confirm" role="group" aria-label={`${chat.title} 삭제 확인`}>
          <span>이 대화를 삭제할까요?</span>
          <div>
            <button type="button" className="is-danger" onClick={onDelete}>삭제</button>
            <button type="button" onClick={onCancel}>취소</button>
          </div>
        </div>
      ) : (
        <>
          <Link
            to={`/chat/${chat.id}`}
            className="chat-item-link"
            aria-current={active ? 'page' : undefined}
            onClick={onOpen}
          >
            <span className="chat-item-title">{chat.title}</span>
            <span className="chat-item-time">{formatWhen(chat.updatedAt)}</span>
          </Link>
          <div className="chat-item-actions">
            <button
              type="button"
              aria-pressed={chat.pinned}
              aria-label={chat.pinned ? `${chat.title} 핀 해제` : `${chat.title} 핀`}
              title={chat.pinned ? '핀 해제' : '핀'}
              onClick={onPin}
            >
              <UiIcon name={chat.pinned ? 'pin-off' : 'pin'} size={18} />
            </button>
            <button type="button" aria-label={`${chat.title} 삭제`} title="삭제" onClick={onAskDelete}><UiIcon name="trash" size={18} /></button>
          </div>
        </>
      )}
    </li>
  )
}

function ChatScreen({ userId }) {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [chats, setChats] = useState(() => loadChats(userId))
  // 답을 기다리는 동안 목록이 바뀌어도 최신 목록에 답을 붙이도록 ref로도 들고 있습니다.
  const chatsRef = useRef(chats)
  const [draft, setDraft] = useState(() => {
    const preset = location.state?.draft
    return typeof preset === 'string' ? preset.slice(0, MAX_USER_CHARS) : ''
  })
  const [pendingId, setPendingId] = useState(null)
  const [failure, setFailure] = useState(null) // { chatId, message }
  const [listOpen, setListOpen] = useState(false)
  const [confirmingId, setConfirmingId] = useState(null)
  const inputRef = useRef(null)
  const endRef = useRef(null)
  const newChatRef = useRef(null)

  const chat = chatId ? chats.find((c) => c.id === chatId) ?? null : null
  const messageCount = chat?.messages.length ?? 0

  const mutate = useCallback((change) => {
    const next = saveChats(userId, change(chatsRef.current))
    chatsRef.current = next
    setChats(next)
  }, [userId])

  // 새 메시지가 오면 마지막 메시지가 보이게 내립니다.
  useEffect(() => {
    if (chatId && messageCount > 0) endRef.current?.scrollIntoView({ block: 'end' })
  }, [chatId, messageCount, pendingId])

  // 모바일에서 대화 목록을 열면 첫 버튼으로 포커스를 옮기고, Esc로 닫을 수 있게 합니다.
  useEffect(() => {
    if (!listOpen) return undefined
    newChatRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') setListOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listOpen])

  if (chatId && !chat) return <Navigate to="/chat" replace />

  async function request(id, messages) {
    setPendingId(id)
    setFailure(null)
    try {
      const result = await sendChat(toChatPayload(messages))
      const reply = {
        id: newId(),
        role: 'ai',
        text: result.reply,
        byAi: Boolean(result.by_ai),
        suggestions: Array.isArray(result.suggestions) ? result.suggestions.slice(0, 3) : [],
      }
      mutate((list) => list.map((c) => (
        c.id === id ? { ...c, messages: [...c.messages, reply], updatedAt: new Date().toISOString() } : c
      )))
    } catch (error) {
      setFailure({ chatId: id, message: errorMessage(error) })
    } finally {
      setPendingId(null)
    }
  }

  function send(text) {
    const content = text.trim()
    if (!content || pendingId) return
    if (content.length > MAX_USER_CHARS) {
      setFailure({ chatId: chat?.id ?? null, message: `${MAX_USER_CHARS}자 이내로 적어 주세요.` })
      return
    }
    const now = new Date().toISOString()
    const message = { id: newId(), role: 'user', text: content }
    const current = chat && chatsRef.current.find((c) => c.id === chat.id)
    let id
    let messages
    if (current) {
      id = current.id
      messages = [...current.messages, message]
      mutate((list) => list.map((c) => (c.id === id ? { ...c, messages, updatedAt: now } : c)))
    } else {
      id = newId()
      messages = [message]
      mutate((list) => [{ id, title: chatTitle(content), pinned: false, createdAt: now, updatedAt: now, messages }, ...list])
      navigate(`/chat/${id}`, { replace: true })
    }
    setDraft('')
    inputRef.current?.focus()
    request(id, messages)
  }

  function retry() {
    const current = chatsRef.current.find((c) => c.id === failure?.chatId)
    if (current && current.messages.at(-1)?.role === 'user') request(current.id, current.messages)
  }

  function togglePin(id) {
    mutate((list) => list.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function remove(id) {
    mutate((list) => list.filter((c) => c.id !== id))
    setConfirmingId(null)
    if (failure?.chatId === id) setFailure(null)
    if (id === chatId) navigate('/chat', { replace: true })
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return
    // 한글 입력 중(조합 중)에 Enter를 누르면 글자 확정만 하고 보내지 않습니다.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    send(draft)
  }

  const pinned = chats.filter((c) => c.pinned)
  const recent = chats.filter((c) => !c.pinned)
  const lastMessage = chat?.messages.at(-1)
  const suggestions = !pendingId && lastMessage?.role === 'ai' ? lastMessage.suggestions ?? [] : []
  const visibleFailure = failure && failure.chatId === (chat?.id ?? null) ? failure : null
  const canRetry = Boolean(visibleFailure && chat && lastMessage?.role === 'user')

  const renderItem = (c) => (
    <ChatItem
      key={c.id}
      chat={c}
      active={c.id === chatId}
      confirming={confirmingId === c.id}
      onOpen={() => setListOpen(false)}
      onPin={() => togglePin(c.id)}
      onAskDelete={() => setConfirmingId(c.id)}
      onDelete={() => remove(c.id)}
      onCancel={() => setConfirmingId(null)}
    />
  )

  return (
    <AppLayout wide>
      <div className="chat">
        <div className={`chat-backdrop${listOpen ? ' is-open' : ''}`} aria-hidden="true" onClick={() => setListOpen(false)} />

        <aside id="chat-sidebar" className={`chat-sidebar${listOpen ? ' is-open' : ''}`} aria-label="대화 목록">
          <div className="chat-sidebar-head">
            <Link to="/chat" ref={newChatRef} className="chat-new" onClick={() => setListOpen(false)}>새 대화</Link>
            <button type="button" className="chat-sidebar-close" onClick={() => setListOpen(false)}>닫기</button>
          </div>

          {pinned.length > 0 && (
            <section className="chat-group" aria-labelledby="chat-pinned-title">
              <h2 id="chat-pinned-title">핀한 대화</h2>
              <ul>{pinned.map(renderItem)}</ul>
            </section>
          )}

          <section className="chat-group" aria-labelledby="chat-recent-title">
            <h2 id="chat-recent-title">최근 대화</h2>
            {recent.length > 0 ? <ul>{recent.map(renderItem)}</ul> : <p className="chat-group-empty">아직 나눈 대화가 없어요.</p>}
          </section>

        </aside>

        <section className="chat-main" aria-labelledby="chat-title">
          <div className="chat-main-head">
            <button
              type="button"
              className="chat-list-toggle"
              aria-expanded={listOpen}
              aria-controls="chat-sidebar"
              onClick={() => setListOpen(true)}
            >
              대화 목록{chats.length > 0 ? ` ${chats.length}` : ''}
            </button>
            <h1 id="chat-title">{chat ? chat.title : 'AI 진로 동료'}</h1>
            {chat && <Link to="/chat" className="chat-new-inline">새 대화</Link>}
          </div>

          {!chat ? (
            <div className="chat-welcome">
              <span className="chat-avatar" aria-hidden="true">AI</span>
              <h2>무엇이든 편하게 물어보세요</h2>
              <p>
                AI 진로 동료는 지금까지 반응한 카드, 저장한 카드, 나와 맞는 직업을 바탕으로 함께 이야기해요.
                직업을 정해 주지는 않아요. 고르는 건 나예요.
              </p>
              <ul className="chat-chips" aria-label="이렇게 시작해 보세요">
                {CHAT_STARTERS.map((starter) => (
                  <li key={starter}>
                    <button type="button" disabled={Boolean(pendingId)} onClick={() => send(starter)}>{starter}</button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="chat-log" role="log" aria-label="대화 내용">
              <ol>
                {chat.messages.map((message) => (
                  <li key={message.id} className={`chat-message is-${message.role}`}>
                    <span className={message.role === 'user' ? 'visually-hidden' : 'chat-speaker'}>
                      {message.role === 'user' ? '나:' : 'AI 동료'}
                    </span>
                    {message.role === 'ai'
                      ? <ReadableText className="chat-bubble" text={message.text} />
                      : <p className="chat-bubble">{message.text}</p>}
                    {message.role === 'ai' && message.byAi === false && (
                      <span className="chat-source">AI 대신 내 기록으로 만든 답이에요</span>
                    )}
                  </li>
                ))}
                {pendingId === chat.id && (
                  <li className="chat-message is-ai is-typing">
                    <span className="chat-speaker">AI 동료</span>
                    <p className="chat-bubble">생각하고 있어요…</p>
                  </li>
                )}
              </ol>
              <div ref={endRef} />
            </div>
          )}

          {visibleFailure && (
            <div className="chat-error" role="alert">
              <p>{visibleFailure.message}</p>
              {canRetry && <button type="button" onClick={retry}>다시 보내기</button>}
            </div>
          )}

          <div className="chat-bottom">
            {suggestions.length > 0 && (
              <ul className="chat-chips is-suggestions" aria-label="이어서 말해 보기">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button type="button" onClick={() => send(suggestion)}>{suggestion}</button>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault()
                send(draft)
              }}
            >
              <label htmlFor="chat-input" className="visually-hidden">AI 동료에게 보낼 말</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={2}
                maxLength={MAX_USER_CHARS}
                value={draft}
                placeholder="궁금한 진로 이야기를 적어 보세요"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="chat-composer-row">
                <span className="chat-count" aria-live="off">{draft.length}/{MAX_USER_CHARS}</span>
                <button type="submit" disabled={!draft.trim() || Boolean(pendingId)}>
                  {pendingId ? '답을 기다리는 중…' : '보내기'}
                </button>
              </div>
            </form>

            <div className="chat-disclaimer">
              <p>AI 동료는 내 반응 기록과 커리어넷 자료로 이야기하지만 틀릴 수 있어요.</p>
              <p>중요한 결정은 선생님·보호자와 함께해요.</p>
              <p>많이 힘들 땐 청소년상담전화 1388에 이야기해 보세요.</p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
