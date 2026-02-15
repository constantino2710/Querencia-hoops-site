import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../ThemeContext'

export function ForgotPassword() {
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300 relative p-4">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-surface border border-border text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
        title="Trocar Tema"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="bg-surface p-6 md:p-8 rounded-xl shadow-lg border border-border w-full max-w-[400px] transition-colors duration-300">
        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Recuperar Senha</h1>
          <p className="text-text-secondary text-sm mt-2">
            {sent ? 'Verifique seu e-mail' : 'Digite seu e-mail para receber o link de recuperação'}
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded text-sm animate-pulse">
            {errorMsg}
          </div>
        )}

        {sent ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Enviar para outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-text-secondary">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full p-3 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>
        )}

        <footer className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-text-secondary">
            Lembrou sua senha?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold hover:underline">
              Voltar ao Login
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
