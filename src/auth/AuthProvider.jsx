import { useEffect, useMemo, useState } from 'react'
import { USE_MOCK } from '../lib/config.js'
import { supabase } from '../lib/supabase.js'
import { mockAuth } from '../mocks/mockBackend.js'
import { AuthContext } from './AuthContext.js'
import { AuthError, toAuthError } from './authErrors.js'

export default function AuthProvider({ children }) {
  // undefined: 확인 중, null: 로그아웃 상태
  const [session, setSession] = useState(USE_MOCK ? mockAuth.getSession() : undefined)

  useEffect(() => {
    if (USE_MOCK) return mockAuth.onChange(setSession)

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => {
    async function signIn(email, password) {
      if (USE_MOCK) return mockAuth.signIn(email)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw toAuthError(error)
      return data.session
    }

    // 반환값 needsConfirmation이 true면 메일 인증 후 로그인해야 합니다.
    async function signUp(email, password) {
      if (USE_MOCK) {
        await mockAuth.signIn(email)
        return { needsConfirmation: false }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw toAuthError(error)
      // 메일 인증을 켠 프로젝트는 이미 가입된 이메일에도 오류 없이 빈 identities를 돌려줍니다.
      if (data.user && data.user.identities?.length === 0) throw new AuthError('user_already_exists')
      return { needsConfirmation: !data.session }
    }

    async function signOut() {
      if (USE_MOCK) return mockAuth.signOut()
      await supabase.auth.signOut()
    }

    return {
      session,
      user: session?.user ?? null,
      loading: session === undefined,
      signIn,
      signUp,
      signOut,
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
