'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/toast'
import type { Teacher } from '@/lib/auth'

type Props = { onBack: () => void }

export default function TeacherPanel({ onBack }: Props) {
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'teacher' | 'super_admin'>('teacher')
  const [inviteLoading, setInviteLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/teachers')
    if (res.ok) setTeachers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast('Name and email are required', 'error')
      return
    }
    setInviteLoading(true)
    const res = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole }),
    })
    const d = await res.json()
    setInviteLoading(false)
    if (!res.ok) { toast(d.error || 'Invite failed', 'error'); return }
    toast(`Invite sent to ${inviteEmail}`, 'success')
    setShowInvite(false)
    setInviteName(''); setInviteEmail(''); setInviteRole('teacher')
    load()
  }

  async function toggleActive(t: Teacher) {
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    if (res.ok) { toast(`${t.name} ${t.active ? 'deactivated' : 'activated'}`, 'success'); load() }
    else toast('Update failed', 'error')
  }

  async function toggleRole(t: Teacher) {
    const newRole = t.role === 'super_admin' ? 'teacher' : 'super_admin'
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) { toast(`${t.name} is now ${newRole === 'super_admin' ? 'Super Admin' : 'Teacher'}`, 'success'); load() }
    else toast('Update failed', 'error')
  }

  return (
    <div className="admin-sans" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm">← Back</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Teachers</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
          + Invite Teacher
        </button>
      </nav>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px' }}>
        {/* Invite form */}
        {showInvite && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              Invite a Teacher
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Full name"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                style={{ width: '100%' }}
              />
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                  Role:
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'teacher' | 'super_admin')}
                  style={{ fontSize: 13, fontFamily: 'inherit' }}
                >
                  <option value="teacher">Teacher</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleInvite}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teacher roster */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 32, textAlign: 'center' }}>
            Loading…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teachers.map(t => (
              <div key={t.id} className="card" style={{
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                opacity: t.active ? 1 : 0.55,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 2 }}>
                    {t.email}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                    padding: '2px 8px', borderRadius: 20,
                    background: t.role === 'super_admin' ? 'rgba(124,77,184,0.15)' : 'rgba(59,125,216,0.12)',
                    color: t.role === 'super_admin' ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'sans-serif',
                  }}>
                    {t.role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleRole(t)}
                    title={t.role === 'super_admin' ? 'Demote to Teacher' : 'Promote to Super Admin'}
                    style={{ fontSize: 11 }}
                  >
                    {t.role === 'super_admin' ? '↓ Teacher' : '↑ Admin'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleActive(t)}
                    style={{ fontSize: 11 }}
                  >
                    {t.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
