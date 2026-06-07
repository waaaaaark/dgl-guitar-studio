'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [isInvite, setIsInvite] = useState(false)

  useEffect(() => {
    // Supabase redirects here with a session in the URL hash after
    // a password reset or invite acceptance. We need to listen for
    // the SIGNED_IN event, which fires after Supabase processes the hash.
    const supabase = createSupabaseBrowserClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
        // If it came from an invite link, the user is new
        if (event === 'SIGNED_IN' && session?.user?.user_metadata?.invited_at) {
          setIsInvite(true)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit() {
    if (!password || !confirm) { setError('Please fill in both fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/admin'), 2000)
  }

  // Waiting for Supabase to process the URL hash
  if (!sessionReady) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-base)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🎸</div>
          Verifying your link…
        </div>
      </div>
    )
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
            {isInvite ? 'Set your password to get started' : 'Set a new password'}
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✅</div>
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10,
              }}>
                Password set!
              </h2>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)', fontFamily: 'sans-serif',
              }}>
                Redirecting you to the admin panel…
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {isInvite && (
                <p style={{
                  fontSize: 14, color: 'var(--text-muted)', fontFamily: 'sans-serif',
                  lineHeight: 1.6, margin: 0,
                  padding: '10px 14px',
                  background: 'rgba(61,122,82,0.08)',
                  border: '1px solid rgba(61,122,82,0.2)',
                  borderRadius: 8,
                }}>
                  👋 Welcome! Create a password to activate your account.
                </p>
              )}

              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 6,
                }}>
                  New password
                </label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 6,
                }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  placeholder="Same password again"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete="new-password"
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
                {loading ? 'Saving…' : 'Set password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
