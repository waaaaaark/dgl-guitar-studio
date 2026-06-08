import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const isSuperAdmin = teacher.role === 'super_admin'

  const studentQ = supabase.from('students').select('*').eq('id', id)
  const { data: student, error } = await (isSuperAdmin ? studentQ : studentQ.eq('teacher_id', teacher.id)).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: lessons } = await supabase
    .from('lessons')
    .select(`*, lesson_songs(song:songs(*))`)
    .eq('student_id', id)
    .order('lesson_date', { ascending: false })

  const { data: repertoire } = await supabase
    .from('student_songs')
    .select(`song:songs(*), first_worked_on, mastery_status, mastered_at`)
    .eq('student_id', id)
    .order('first_worked_on', { ascending: false })

  return NextResponse.json({ student, lessons: lessons || [], repertoire: repertoire || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const isSuperAdmin = teacher.role === 'super_admin'

  const updateQ = supabase.from('students').update(body).eq('id', id)
  const { data, error } = await (isSuperAdmin ? updateQ : updateQ.eq('teacher_id', teacher.id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const isSuperAdmin = teacher.role === 'super_admin'

  const deleteQ = supabase.from('students').delete().eq('id', id)
  const { error } = await (isSuperAdmin ? deleteQ : deleteQ.eq('teacher_id', teacher.id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
