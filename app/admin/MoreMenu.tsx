'use client'

import { ThemeToggle } from '@/lib/theme'
import { useTeacher } from '@/lib/TeacherContext'

type View = 'tips' | 'analytics' | 'settings' | 'teacher-panel'

type Props = {
  onNavigate: (view: View) => void
  onBack: () => void
  onLogout: () => void
}

export default function MoreMenu({ onNavigate, onBack, onLogout }: Props) {
  const teacher = useTeacher()

  const items: { view: View; icon: string; label: string; desc: string }[] = [
    { view: 'analytics', icon: '📊', label: 'Analytics', desc: 'Student page views, practice stats, belt distribution' },
    ...(teacher.role === 'super_admin' ? [
      { view: 'tips' as const, icon: '💡', label: 'Practice Tips', desc: 'Manage tips shown to students during practice' },
      { view: 'settings' as const, icon: '⚙️', label: 'Settings', desc: 'Studio name, defaults, email templates' },
      { view: 'teacher-panel' as const, icon: '👥', label: 'Teachers', desc: 'Manage teachers, invite new staff, assign roles' },
    ] : []),
  ]

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
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>More</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          <button onClick={onLogout} className="btn btn-ghost btn-sm">Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
          More
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, width: '100%',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-dim)'; e.currentTarget.style.boxShadow = '0 2px 8px var(--accent-glow)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0, marginLeft: 'auto' }}>›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
