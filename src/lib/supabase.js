import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, USE_MOCK } from './config.js'

// 목업 모드에서는 클라이언트를 만들지 않습니다.
export const supabase = USE_MOCK ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
