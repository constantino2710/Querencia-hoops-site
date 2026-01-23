import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

// Importe suas páginas
import {Login} from './pages/login'
import {Register} from './pages/register'
import {Dashboard} from './pages/dashboard'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Verifica a sessão atual ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Fica escutando mudanças (Login, Logout, Expiração)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    // Limpa o ouvinte quando o componente desmontar
    return () => subscription.unsubscribe()
  }, [])

  // Enquanto verifica o login, mostra uma tela de carregamento simples
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-blue-600 font-bold text-xl animate-pulse">
          Carregando sistema...
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA RAIZ (/):
           Se tem sessão -> Dashboard
           Se não tem -> Login
        */}
        <Route 
          path="/" 
          element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        
        {/* ROTAS PÚBLICAS (Login/Registro):
           Se o usuário JÁ estiver logado, não deixamos ele ver o login,
           mandamos direto pro Dashboard.
        */}
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!session ? <Register /> : <Navigate to="/dashboard" replace />} 
        />

        {/* ROTA PROTEGIDA (Dashboard):
           Se NÃO tiver sessão, manda pro Login.
        */}
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App