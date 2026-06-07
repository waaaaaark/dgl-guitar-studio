import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, inviteTeacher } from '@/lib/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (teacher.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createSupabaseServiceClient()
  const { data, error } = await service
    .from('teachers')
    .select('id, user_id, name, email, role, active, created_at')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (teacher.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, name, role } = await req.json()
  if (!email || !name) return NextResponse.json({ error: 'email and name are required' }, { status: 400 })

  try {
    await inviteTeacher(email, name, teacher.id, role ?? 'teacher')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
