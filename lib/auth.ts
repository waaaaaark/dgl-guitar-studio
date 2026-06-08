import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './supabase/server'

export type Teacher = {
  id: string
  user_id: string
  name: string
  email: string
  role: 'teacher' | 'super_admin'
  active: boolean
  created_at: string
}

/**
 * Returns the currently logged-in teacher record from the DB,
 * or null if the user is not authenticated / not in teachers table.
 */
export async function getCurrentTeacher(): Promise<Teacher | null> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  // Service role bypasses RLS — correct for an identity lookup
  const { createSupabaseServiceClient } = await import('./supabase/server')
  const service = createSupabaseServiceClient()

  const { data: teacher, error } = await service
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !teacher) return null
  return teacher as Teacher
}

/**
 * Use in admin API routes that any teacher can access.
 * Returns the teacher record or null — API route should return 401 if null.
 *
 * Replaces the old checkAdminAuth() cookie check.
 */
export async function checkAdminAuth(): Promise<Teacher | null> {
  const teacher = await getCurrentTeacher()
  if (!teacher || !teacher.active) return null
  return teacher
}

/**
 * Use in Server Components / layouts that require a logged-in teacher.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<Teacher> {
  const teacher = await getCurrentTeacher()
  if (!teacher || !teacher.active) redirect('/login')
  return teacher
}

/**
 * Use in Server Components / layouts that require super admin role.
 * Redirects to /admin if authenticated but not a super admin.
 */
export async function requireSuperAdmin(): Promise<Teacher> {
  const teacher = await requireAuth()
  if (teacher.role !== 'super_admin') redirect('/admin')
  return teacher
}

/**
 * Invite a new teacher via Supabase Auth.
 * Only callable server-side with service role.
 * Supabase sends the invite email automatically.
 */
export async function inviteTeacher(
  email: string,
  name: string,
  invitedBy: string,
  role: 'teacher' | 'super_admin' = 'teacher'
) {
  const { createSupabaseServiceClient } = await import('./supabase/server')
  const supabase = createSupabaseServiceClient()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl || baseUrl.includes('localhost')) {
    throw new Error('NEXT_PUBLIC_BASE_URL must be set to the production URL before sending invites')
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name, role },
    redirectTo: `${baseUrl}/reset-password`,
  })

  if (error) throw error

  // Log the invite in our own table for record-keeping
  await supabase.from('teacher_invites').insert({
    email,
    invited_by: invitedBy,
    accepted: false,
  })

  return data
}
