export type Belt = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black'

export const BELT_ORDER: Belt[] = ['White', 'Blue', 'Purple', 'Brown', 'Black']

export const BELT_COLORS: Record<Belt, string> = {
  White: '#f0ece4',
  Blue: '#3b7dd8',
  Purple: '#7c4db8',
  Brown: '#8b5e3c',
  Black: '#1a1814',
}

export const BELT_TEXT_COLORS: Record<Belt, string> = {
  White: '#1a1814',
  Blue: '#ffffff',
  Purple: '#ffffff',
  Brown: '#ffffff',
  Black: '#f0ece4',
}

export const STRIPE_XP: Record<Belt, number> = {
  White: 2500,
  Blue: 4000,
  Purple: 6000,
  Brown: 8000,
  Black: 0,
}

export const SONG_MASTERY_XP = 100
export const XP_PER_MINUTE = 1
export const DAILY_MINUTE_CAP = 120
export const MAX_SESSION_MINUTES = 90
export const INACTIVITY_WARN_MINUTES = 20
export const FLAG_SESSION_MINUTES = 60
