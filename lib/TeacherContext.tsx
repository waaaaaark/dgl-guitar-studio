'use client'

import { createContext, useContext } from 'react'
import type { Teacher } from './auth'

const TeacherContext = createContext<Teacher | null>(null)

export function TeacherProvider({
  teacher,
  children,
}: {
  teacher: Teacher
  children: React.ReactNode
}) {
  return (
    <TeacherContext.Provider value={teacher}>
      {children}
    </TeacherContext.Provider>
  )
}

/**
 * Use this hook in any client component inside /admin to get
 * the current teacher's name, email, role, and id.
 *
 * Example:
 *   const teacher = useTeacher()
 *   const isSuperAdmin = teacher.role === 'super_admin'
 */
export function useTeacher(): Teacher {
  const ctx = useContext(TeacherContext)
  if (!ctx) throw new Error('useTeacher must be used inside AdminLayout')
  return ctx
}
