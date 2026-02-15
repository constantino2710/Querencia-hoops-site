import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../ThemeContext'

export function Login() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    // p-4 adicionado para evitar que o card encoste nas bordas do celular
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300 relative p-4">
      
      {/* BOTÃO DE TEMA - Ajustado posicionamento para mobile */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-surface border border-border text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
        title="Trocar Tema"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* CARD DE LOGIN - max-w-md garante que não estique demais no desktop */}
      <div className="bg-surface p-6 md:p-8 rounded-xl shadow-lg border border-border w-full max-w-[400px] transition-colors duration-300">
        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Entrar</h1>
          <p className="text-text-secondary text-sm mt-2">Acesse sua conta para continuar</p>
        </header>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded text-sm animate-pulse">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-text-secondary">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full p-3 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base" // text-base evita zoom automático no iOS
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-semibold text-text-secondary">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
          >
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>

        <footer className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-text-secondary">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}