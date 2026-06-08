'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/toast'
import { useTeacher } from '@/lib/TeacherContext'
import type { Teacher } from '@/lib/auth'

type Props = { onBack: () => void }

export default function TeacherPanel({ onBack }: Props) {
  const { toast } = useToast()
  const currentTeacher = useTeacher()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'teacher' | 'super_admin'>('teacher')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [resetFor, setResetFor] = useState<string>('')

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

  async function saveName(t: Teacher) {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === t.name) { setEditingId(null); return }
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) { toast('Name updated', 'success'); load() }
    else toast('Update failed', 'error')
    setEditingId(null)
  }

  async function toggleActive(t: Teacher) {
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    if (res.ok) { toast(`${t.name} ${t.active ? 'deactivated' : 'reactivated'}`, 'success'); load() }
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

  async function deleteTeacher(t: Teacher) {
    if (!confirm(`Permanently delete ${t.name}? This removes their account and cannot be undone.`)) return
    const res = await fetch(`/api/teachers/${t.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (res.ok) { toast(`${t.name} deleted`, 'success'); load() }
    else toast(d.error || 'Delete failed', 'error')
  }

  async function sendPasswordReset(t: Teacher) {
    const res = await fetch(`/api/teachers/${t.id}/reset-password`, { method: 'POST' })
    const d = await res.json()
    if (!res.ok) { toast(d.error || 'Failed to generate reset link', 'error'); return }
    setResetLink(d.link)
    setResetFor(t.name)
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
                <label style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>Role:</label>
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
                <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
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

        {/* Reset link modal */}
        {resetLink && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <div className="card" style={{ padding: 24, maxWidth: 520, width: '100%' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                Password Reset Link — {resetFor}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontFamily: 'sans-serif', lineHeight: 1.5 }}>
                Copy this link and send it to the teacher. It expires after 24 hours.
              </p>
              <div style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '10px 12px', fontSize: 12,
                fontFamily: 'monospace', wordBreak: 'break-all',
                color: 'var(--text-muted)', marginBottom: 16,
              }}>
                {resetLink}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setResetLink(null); setResetFor('') }}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(resetLink)
                    toast('Link copied to clipboard', 'success')
                  }}
                >
                  Copy Link
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
                opacity: t.active ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  {/* Name / email */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {editingId === t.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveName(t)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onBlur={() => saveName(t)}
                        style={{ fontSize: 14, fontWeight: 600, width: '100%', maxWidth: 240 }}
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingId(t.id); setEditName(t.name) }}
                        title="Click to edit name"
                        style={{
                          background: 'none', border: 'none', cursor: 'text', padding: 0,
                          fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                          textAlign: 'left',
                        }}
                      >
                        {t.name}
                      </button>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 2 }}>
                      {t.email}
                      {t.user_id === currentTeacher.user_id && (
                        <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 600 }}>(you)</span>
                      )}
                    </div>
                  </div>

                  {/* Role badge + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '2px 8px', borderRadius: 20,
                      background: t.role === 'super_admin' ? 'rgba(124,77,184,0.15)' : 'rgba(59,125,216,0.12)',
                      color: t.role === 'super_admin' ? 'var(--accent)' : 'var(--text-muted)',
                      fontFamily: 'sans-serif',
                    }}>
                      {t.role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                    </span>

                    {t.user_id !== currentTeacher.user_id && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                {/* Secondary actions row */}
                {t.user_id !== currentTeacher.user_id && (
                  <div style={{
                    marginTop: 10, paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    display: 'flex', gap: 6,
                  }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => sendPasswordReset(t)}
                      style={{ fontSize: 11 }}
                      title="Generate a password reset link for this teacher"
                    >
                      Reset Password
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteTeacher(t)}
                      style={{ fontSize: 11, color: 'var(--error, #e55)' }}
                      title="Permanently delete this teacher account"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
