import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const teacher = await checkAdminAuth()
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSuperAdmin = teacher.role === 'super_admin'

  // Scope to teacher's own students for non-super-admin
  let studentIds: string[] | null = null
  if (!isSuperAdmin) {
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('teacher_id', teacher.id)
      .not('name', 'like', '%__test__%')
    studentIds = (data || []).map(s => s.id)
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const buildStudentsQ = () => {
    const q = supabase.from('students').select('id, active, belt, current_streak, name').not('name', 'like', '%__test__%')
    return studentIds ? q.in('id', studentIds) : q
  }

  const buildLessonsQ = (extraFilters?: (q: any) => any) => {
    let q = supabase.from('lessons').select('id, lesson_date')
    if (!isSuperAdmin) q = q.eq('teacher_id', teacher.id)
    return extraFilters ? extraFilters(q) : q
  }

  const buildPracticeQ = () => {
    const q = supabase.from('practice_sessions').select('duration_minutes, xp_earned, student_id').gte('created_at', startOfWeek)
    return studentIds ? q.in('student_id', studentIds) : q
  }

  const buildPageViewsQ = (allTime = false) => {
    let q = supabase.from('page_views').select(allTime ? 'student_id' : 'id, student_id, viewed_at')
    if (!allTime) q = (q as any).gte('viewed_at', startOfMonth)
    return studentIds ? (q as any).in('student_id', studentIds) : q
  }

  const buildBeltQ = () => {
    const q = supabase.from('students').select('belt').not('name', 'like', '%__test__%').eq('active', true)
    return studentIds ? q.in('id', studentIds) : q
  }

  const buildSongsQ = () => {
    const q = supabase.from('student_songs').select('song_id, song:songs(title, artist)')
    return studentIds ? q.in('student_id', studentIds) : q
  }

  const buildRecentLessonsQ = () => {
    let q = supabase.from('lessons')
      .select('id, lesson_date, student:students(name)')
      .order('lesson_date', { ascending: false })
      .limit(5)
    if (!isSuperAdmin) q = q.eq('teacher_id', teacher.id)
    return q
  }

  const [
    studentsRes,
    lessonsThisMonthRes,
    lessonsLastMonthRes,
    practiceThisWeekRes,
    pageViewsRes,
    pageViewsPerStudentRes,
    beltDistRes,
    topSongsRes,
    recentActivityRes,
  ] = await Promise.all([
    buildStudentsQ(),
    buildLessonsQ(q => q.gte('lesson_date', startOfMonth.split('T')[0])),
    buildLessonsQ(q => q.gte('lesson_date', startOfLastMonth.split('T')[0]).lt('lesson_date', startOfMonth.split('T')[0])),
    buildPracticeQ(),
    buildPageViewsQ(false),
    buildPageViewsQ(true),
    buildBeltQ(),
    buildSongsQ(),
    buildRecentLessonsQ(),
  ])

  const students = studentsRes.data || []
  const activeStudents = students.filter(s => s.active)
  const inactiveStudents = students.filter(s => !s.active)

  const viewsPerStudent: Record<string, number> = {}
  for (const v of (pageViewsPerStudentRes.data || [])) {
    viewsPerStudent[v.student_id] = (viewsPerStudent[v.student_id] || 0) + 1
  }

  const studentViewData = students
    .map(s => ({ id: s.id, name: s.name, views: viewsPerStudent[s.id] || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  const beltCounts: Record<string, number> = {}
  for (const s of (beltDistRes.data || [])) {
    beltCounts[s.belt] = (beltCounts[s.belt] || 0) + 1
  }

  const songCounts: Record<string, { title: string; artist: string | null; count: number }> = {}
  for (const ss of (topSongsRes.data || [])) {
    const id = ss.song_id
    if (!songCounts[id]) songCounts[id] = { title: (ss.song as any)?.title || '', artist: (ss.song as any)?.artist || null, count: 0 }
    songCounts[id].count++
  }
  const topSongs = Object.values(songCounts).sort((a, b) => b.count - a.count).slice(0, 10)

  const practiceSessions = practiceThisWeekRes.data || []
  const totalPracticeMinutesWeek = practiceSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const uniquePracticingStudents = new Set(practiceSessions.map(s => s.student_id)).size

  const topStreaks = activeStudents
    .filter(s => s.current_streak > 0)
    .sort((a, b) => b.current_streak - a.current_streak)
    .slice(0, 5)
    .map(s => ({ name: s.name, streak: s.current_streak }))

  return NextResponse.json({
    students: {
      active: activeStudents.length,
      inactive: inactiveStudents.length,
      total: students.length,
    },
    lessons: {
      thisMonth: lessonsThisMonthRes.data?.length || 0,
      lastMonth: lessonsLastMonthRes.data?.length || 0,
    },
    practice: {
      sessionsThisWeek: practiceSessions.length,
      minutesThisWeek: totalPracticeMinutesWeek,
      studentsActivethisWeek: uniquePracticingStudents,
    },
    pageViews: {
      thisMonth: pageViewsRes.data?.length || 0,
      perStudent: studentViewData,
    },
    belts: beltCounts,
    topSongs,
    topStreaks,
    recentLessons: recentActivityRes.data || [],
  })
}
