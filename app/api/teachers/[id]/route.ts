import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (teacher.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Only allow updating role and active — nothing else
  const patch: Record<string, unknown> = {}
  if ('role' in body) patch.role = body.role
  if ('active' in body) patch.active = body.active

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
