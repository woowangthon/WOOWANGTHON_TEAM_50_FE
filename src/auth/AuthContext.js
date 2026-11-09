import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { session, user, loading, signIn, signUp, signOut }
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.')
  return value
}
