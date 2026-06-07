import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'

// This layout protects all /admin routes.
// The middleware handles the redirect to /login for unauthenticated users,
// but we do a server-side check here as a second layer and to get the teacher record.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // requireAuth() redirects to /login if not authenticated
  const teacher = await requireAuth()

  return (
    <div>
      {/* 
        Pass teacher info down via a context provider or directly as props
        to child Server/Client Components as needed.
        
        For client components that need teacher info (name, role, etc.),
        use a TeacherProvider (see TeacherProvider.tsx below).
        
        For API routes, use checkAdminAuth() from lib/auth.ts.
      */}
      <TeacherProvider teacher={teacher}>
        {children}
      </TeacherProvider>
    </div>
  )
}

// ---------------------------------------------------------------
// TeacherProvider — makes the teacher record available to all
// client components in the admin section via useTeacher() hook.
// Put this in lib/TeacherContext.tsx (shown below).
// ---------------------------------------------------------------

// Import from the context file once created:
import { TeacherProvider } from '@/lib/TeacherContext'
