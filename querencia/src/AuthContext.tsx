/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

interface AuthContextType {
  session: Session | null
  user: User | null // Necessário para o Dashboard
  userRoles: string[]
  role: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  const role = userRoles.includes('ADMIN') ? 'ADMIN' 
    : userRoles.includes('TEACHER') ? 'TEACHER' 
    : userRoles.includes('STUDENT') ? 'STUDENT' 
    : null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRoles(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setLoading(true)
        fetchRoles(session.user.id)
      } else {
        setUserRoles([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRoles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId)

      if (error) throw error
      if (data) {
        const roles = data.map((item: any) => item.roles?.name?.trim().toUpperCase()).filter(Boolean)
        setUserRoles(roles) 
      }
    } catch (err) {
      console.error('Erro ao buscar roles:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUserRoles([])
  }

  return (
    <AuthContext.Provider value={{ session, user, userRoles, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)