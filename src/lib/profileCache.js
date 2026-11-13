import { getMe } from '../api/me.js'

// 헤더처럼 여러 화면에서 내 프로필(닉네임)만 필요할 때 GET /me를 계정별로 한 번만 부르도록 기억합니다.
// 홈이 /me를 받아 오면 rememberMe로 채워 두고, 프로필을 고치거나 로그아웃하면 forgetMe로 비웁니다.
let cache = { userId: null, promise: null }

export function loadMe(userId) {
  if (cache.userId === userId && cache.promise) return cache.promise
  const promise = getMe()
  cache = { userId, promise }
  // 실패(프로필 없음 등)는 기억하지 않아 다음에 다시 물어봅니다.
  promise.catch(() => {
    if (cache.promise === promise) cache = { userId: null, promise: null }
  })
  return promise
}

export function rememberMe(userId, me) {
  if (userId) cache = { userId, promise: Promise.resolve(me) }
}

export function forgetMe() {
  cache = { userId: null, promise: null }
}
