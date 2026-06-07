'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎸</div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            David's Guitar Loft
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
            Password reset
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>📬</div>
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10,
              }}>
                Check your email
              </h2>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)', fontFamily: 'sans-serif',
                lineHeight: 1.6,
              }}>
                We sent a password reset link to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>.
                Click the link in that email to set a new password.
              </p>
              <p style={{
                fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif',
                marginTop: 16,
              }}>
                Didn't get it? Check your spam folder or{' '}
                <button
                  onClick={() => setSent(false)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--accent)', cursor: 'pointer', fontSize: 12,
                  }}
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)', fontFamily: 'sans-serif',
                lineHeight: 1.6, margin: 0,
              }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 6,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete="email"
                  style={{ width: '100%' }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(192,103,90,0.1)',
                  border: '1px solid rgba(192,103,90,0.3)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--red)',
                  fontFamily: 'sans-serif',
                }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a
            href="/login"
            style={{
              fontSize: 13, color: 'var(--text-muted)',
              fontFamily: 'sans-serif', textDecoration: 'none',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}
