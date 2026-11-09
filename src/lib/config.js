// 환경 변수는 .env.local에 둡니다. (.env.example 참고)
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Supabase 키가 없거나 VITE_USE_MOCK=true면 백엔드 없이 목업 데이터로 동작합니다.
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' || !SUPABASE_URL || !SUPABASE_ANON_KEY
