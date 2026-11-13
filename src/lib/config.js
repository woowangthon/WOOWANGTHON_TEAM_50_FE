// 환경 변수는 .env.local(또는 .env)에 둡니다. (.env.example 참고)
// docs/backend-api-guide.txt의 변수 이름(VITE_API_URL, VITE_SUPABASE_PUBLISHABLE_KEY)도 함께 읽습니다.
const env = import.meta.env

// 주소를 따로 넣지 않으면 배포 서버(Render)로 연결합니다. 로컬 백엔드를 쓸 때는 VITE_API_URL=http://localhost:8000
export const DEFAULT_API_URL = 'https://findme-api-rxg3.onrender.com'
export const API_BASE_URL = (env.VITE_API_BASE_URL || env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://fbctzysvmyedxvucopxt.supabase.co'
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''

// Supabase 키가 없거나 VITE_USE_MOCK=true면 백엔드 없이 목업 데이터로 동작합니다.
export const USE_MOCK = env.VITE_USE_MOCK === 'true' || !SUPABASE_ANON_KEY
