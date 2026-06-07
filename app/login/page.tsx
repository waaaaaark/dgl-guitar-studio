'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authError.message
      )
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
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

        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 32, marginBottom: 10,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
          }}>🎸</div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            David's Guitar Loft
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
            Teacher portal
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 6,
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
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
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <a
              href="/forgot-password"
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                fontFamily: 'sans-serif',
                textDecoration: 'none',
              }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Forgot your password?
            </a>
          </div>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 24, fontSize: 12,
          color: 'var(--text-muted)', fontFamily: 'sans-serif',
        }}>
          Don't have an account? Ask your studio admin.
        </p>
      </div>
    </div>
  )
}
