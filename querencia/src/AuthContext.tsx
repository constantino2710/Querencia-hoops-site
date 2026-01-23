/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

// Definição do formato dos dados do contexto
interface AuthContextType {
  session: Session | null
  userRoles: string[]
  loading: boolean
  signOut: () => Promise<void>
}

// Cria o contexto vazio inicialmente
const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Pega sessão inicial ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchRoles(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Escuta mudanças (Login, Logout, Expiração)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setLoading(true)
        fetchRoles(session.user.id)
      } else {
        setUserRoles([]) // Limpa roles se deslogar
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Função robusta para buscar os cargos
  async function fetchRoles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId)

      if (error) throw error

      if (data) {
        // O .trim() remove espaços invisíveis
        // O .toUpperCase() garante que Teacher vire TEACHER
        const roles = data
          .map((item: any) => item.roles?.name?.trim().toUpperCase()) 
          .filter(Boolean)
          
        console.log('Roles encontradas e limpas:', roles)
        
        // --- ESTA É A LINHA MAIS IMPORTANTE ---
        setUserRoles(roles) 
      }
    } catch (err) {
      console.error('Erro ao buscar roles:', err)
      setUserRoles([])
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUserRoles([])
  }

  return (
    <AuthContext.Provider value={{ session, userRoles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto
export const useAuth = () => useContext(AuthContext)