import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../ThemeContext'

export function ResetPassword() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    navigate('/login', { state: { message: 'Senha alterada com sucesso! Faça login com sua nova senha.' } })
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
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Nova Senha</h1>
          <p className="text-text-secondary text-sm mt-2">Digite sua nova senha abaixo</p>
        </header>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded text-sm animate-pulse">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-text-secondary">Nova Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 pr-11 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-semibold text-text-secondary">Confirmar Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                className="w-full p-3 pr-11 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
          >
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
