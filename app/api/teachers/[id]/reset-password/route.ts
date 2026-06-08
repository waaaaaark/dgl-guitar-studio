import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (teacher.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const service = createSupabaseServiceClient()

  const { data: target, error: fetchErr } = await service
    .from('teachers')
    .select('email')
    .eq('id', id)
    .single()

  if (fetchErr || !target?.email) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: 'recovery',
    email: target.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password` },
  })

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

  return NextResponse.json({ link: linkData.properties?.action_link })
}
