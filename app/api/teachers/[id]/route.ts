import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (teacher.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const patch: Record<string, unknown> = {}
  if ('role' in body) patch.role = body.role
  if ('active' in body) patch.active = body.active
  if ('name' in body && typeof body.name === 'string' && body.name.trim()) {
    patch.name = body.name.trim()
  }

  const service = createSupabaseServiceClient()
  const { data, error } = await service
    .from('teachers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (teacher.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const service = createSupabaseServiceClient()

  const { data: target, error: fetchErr } = await service
    .from('teachers')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.user_id === teacher.user_id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const { error: delErr } = await service.from('teachers').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (target.user_id) {
    await service.auth.admin.deleteUser(target.user_id)
  }

  return NextResponse.json({ ok: true })
}
