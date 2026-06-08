'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/toast'
import type { Teacher } from '@/lib/auth'

type StudentRow = {
  id: string
  name: string
  email: string | null
  active: boolean
  skill_level: string
  lesson_frequency: string
  lesson_count: number
  teacher_id: string | null
  teacher_name: string | null
  start_date: string
  pending_mastery: number
}

type Props = {
  onStudentSelect: (student: any) => void
  onAdd: () => void
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function SuperAdminRoster({ onStudentSelect, onAdd }: Props) {
  const { toast } = useToast()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat')
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [search, setSearch] = useState('')
  const [reassigningId, setReassigningId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [studentsRes, teachersRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/teachers'),
    ])
    const studentsData = studentsRes.ok ? await studentsRes.json() : []
    const teachersData = teachersRes.ok ? await teachersRes.json() : []
    setStudents(studentsData)
    setTeachers(teachersData.filter((t: Teacher) => t.active))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function reassign(studentId: string, teacherId: string) {
    const res = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: teacherId || null }),
    })
    if (res.ok) { toast('Student reassigned', 'success'); load() }
    else toast('Reassign failed', 'error')
    setReassigningId(null)
  }

  async function toggleActive(s: StudentRow) {
    const res = await fetch(`/api/students/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    if (res.ok) { toast(`${s.name} ${s.active ? 'deactivated' : 'reactivated'}`, 'success'); load() }
    else toast('Update failed', 'error')
  }

  async function deleteStudent(s: StudentRow) {
    if (!confirm(`Permanently delete ${s.name}? This cannot be undone.`)) return
    const res = await fetch(`/api/students/${s.id}`, { method: 'DELETE' })
    if (res.ok) { toast(`${s.name} deleted`, 'success'); load() }
    else toast('Delete failed', 'error')
  }

  const real = (s: StudentRow) => !s.name.includes('__test__')
  const activeStudents = students.filter(s => s.active && real(s))
  const inactiveStudents = students.filter(s => !s.active && real(s))

  const filterList = (list: StudentRow[]) =>
    search.trim()
      ? list.filter(s =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.teacher_name || '').toLowerCase().includes(search.toLowerCase())
        )
      : list

  const displayList = filterList(activeTab === 'active' ? activeStudents : inactiveStudents)

  // Grouped: unassigned first, then by teacher
  const unassignedStudents = displayList.filter(s => !s.teacher_id)
  const groupedByTeacher = teachers.map(t => ({
    teacher: t,
    students: displayList.filter(s => s.teacher_id === t.id),
  })).filter(g => g.students.length > 0)

  function StudentCard({ s }: { s: StudentRow }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 8,
      }}>
        {/* Clickable name area */}
        <button
          onClick={() => onStudentSelect(s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', flex: 1, minWidth: 0, padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-tag-bg)', border: '1px solid var(--accent-tag-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontSize: 11, fontWeight: 700,
          }}>
            {getInitials(s.name.replace('__test__', '').trim())}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {viewMode === 'flat' && (
                <span style={{ marginRight: 6 }}>
                  {s.teacher_name
                    ? s.teacher_name
                    : <em>Unassigned</em>
                  } ·{' '}
                </span>
              )}
              {s.lesson_count} lessons · {s.skill_level}
            </div>
          </div>
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
          {s.pending_mastery > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20,
              background: 'rgba(200,169,110,0.15)', color: 'var(--accent)',
              border: '1px solid rgba(200,169,110,0.3)',
            }}>⭐ {s.pending_mastery}</span>
          )}

          {reassigningId === s.id ? (
            <select
              autoFocus
              defaultValue={s.teacher_id || ''}
              onChange={e => reassign(s.id, e.target.value)}
              onBlur={() => setReassigningId(null)}
              style={{ fontSize: 11, fontFamily: 'inherit' }}
            >
              <option value="">— Unassigned —</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setReassigningId(s.id)} style={{ fontSize: 11 }}>
              Reassign
            </button>
          )}

          <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(s)} style={{ fontSize: 11 }}>
            {s.active ? 'Deactivate' : 'Reactivate'}
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => deleteStudent(s)}
            style={{ fontSize: 11, color: 'var(--error, #d95)' }}
          >
            Delete
          </button>

          <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Active students', value: activeStudents.length },
          { label: 'Inactive', value: inactiveStudents.length },
          { label: 'Teachers', value: teachers.length },
          { label: 'Unassigned', value: activeStudents.filter(s => !s.teacher_id).length },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Active / Inactive tab */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {([
              { key: 'active', label: `Active (${activeStudents.length})` },
              { key: 'inactive', label: `Inactive (${inactiveStudents.length})` },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '5px 12px', fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-card)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Flat / Grouped toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {([
              { key: 'flat', label: 'All' },
              { key: 'grouped', label: 'By Teacher' },
            ] as const).map(mode => (
              <button key={mode.key} onClick={() => setViewMode(mode.key)} style={{
                padding: '5px 12px', fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: viewMode === mode.key ? 'var(--accent)' : 'var(--bg-card)',
                color: viewMode === mode.key ? '#fff' : 'var(--text-muted)',
              }}>{mode.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Search by name or teacher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add Student</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>Loading…</div>
      ) : viewMode === 'flat' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displayList.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No students found.</div>
            : displayList.map(s => <StudentCard key={s.id} s={s} />)
          }
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {unassignedStudents.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                Unassigned — {unassignedStudents.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {unassignedStudents.map(s => <StudentCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
          {groupedByTeacher.map(({ teacher, students: ts }) => (
            <div key={teacher.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {teacher.name}
                </span>
                {teacher.role === 'super_admin' && <span style={{ fontSize: 11, color: 'var(--accent)' }}>★</span>}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {ts.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ts.map(s => <StudentCard key={s.id} s={s} />)}
              </div>
            </div>
          ))}
          {groupedByTeacher.length === 0 && unassignedStudents.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No students found.</div>
          )}
        </div>
      )}
    </>
  )
}
