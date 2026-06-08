import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Belt } from './constants'
export type { Belt } from './constants'
export { BELT_ORDER, BELT_COLORS, BELT_TEXT_COLORS, STRIPE_XP, SONG_MASTERY_XP, XP_PER_MINUTE, DAILY_MINUTE_CAP, MAX_SESSION_MINUTES, INACTIVITY_WARN_MINUTES, FLAG_SESSION_MINUTES } from './constants'

let _client: SupabaseClient | null = null

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    // API routes run server-side: prefer service role key to bypass RLS.
    // Falls back to anon key (client-side or missing service key).
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _client = createClient(url, key)
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

export type StudentProfile = 'Child' | 'Teen' | 'Adult'

export type Student = {
  id: string
  name: string
  email: string | null
  token: string
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced'
  lesson_frequency: 'Weekly' | 'Bi-weekly' | 'Monthly'
  start_date: string
  lesson_count: number
  admin_notes: string | null
  active: boolean
  inactive_date: string | null
  created_at: string
  student_profile: StudentProfile
  belt_system_active: boolean
  belt: Belt
  belt_stripes: number
  total_xp: number
  current_stripe_xp: number
  stripe_eligible: boolean
  belt_eligible: boolean
  current_streak: number
  longest_streak: number
  last_practice_date: string | null
  total_practice_minutes: number
  practice_goal_minutes_week: number | null
}

export type Song = {
  id: string
  title: string
  artist: string | null
  created_at: string
  tags?: string[]
}

export type Lesson = {
  id: string
  student_id: string
  lesson_date: string
  what_we_covered: string
  focus_for_week: string
  created_at: string
}

export type PracticeSession = {
  id: string
  student_id: string
  session_date: string
  duration_minutes: number
  xp_earned: number
  flagged: boolean
  created_at: string
}

export type XPEvent = {
  id: string
  student_id: string
  amount: number
  reason: string
  event_type: 'practice' | 'song_mastery' | 'manual_award' | 'manual_deduct' | 'stripe_earn' | 'belt_earn'
  created_at: string
}

export type StudentSong = {
  student_id: string
  song_id: string
  first_worked_on: string
  mastery_status: 'working' | 'eligible' | 'mastered'
  mastered_at: string | null
  song?: Song
}
export type ResourceType = 'PDF' | 'Video' | 'Article' | 'Chord Chart' | 'Exercise' | 'Backing Track' | 'Other'
export const RESOURCE_TYPES: ResourceType[] = ['PDF', 'Video', 'Article', 'Chord Chart', 'Exercise', 'Backing Track', 'Other']

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  PDF: '📄',
  Video: '🎬',
  Article: '📰',
  'Chord Chart': '🎸',
  Exercise: '🏋️',
  'Backing Track': '🎵',
  Other: '📎',
}

export type Resource = {
  id: string
  title: string
  description: string | null
  resource_type: ResourceType
  source_type: 'link' | 'upload'
  url: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  tags: string[]
  active: boolean
  created_at: string
}

export type StudentResource = {
  id: string
  student_id: string
  resource_id: string
  assigned_at: string
  note: string | null
  resource?: Resource
}
