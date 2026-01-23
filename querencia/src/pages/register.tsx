import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../ThemeContext' // <--- Importe o tema

export function Register() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme() // <--- Hook do tema
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 1. Cria o usuário no Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name, // Envia o nome como metadado
        },
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    // 2. Tenta atualizar o perfil público (caso o Trigger falhe ou demore)
    if (data.user) {
      await supabase
        .from('users')
        .update({ name: name })
        .eq('id', data.user.id)
    }

    alert('Cadastro realizado! Você já pode entrar.')
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300 relative">
      
      {/* BOTÃO DE TEMA */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full bg-surface border border-border text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
        title="Trocar Tema"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* CARD DE REGISTRO */}
      <div className="bg-surface p-8 rounded-lg shadow-md border border-border w-full max-w-md transition-colors duration-300">
        <h1 className="text-2xl font-bold mb-6 text-center text-text-primary">Crie sua Conta</h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-text-secondary">Nome Completo</label>
            <input
              type="text"
              className="w-full p-2 rounded border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-text-secondary">E-mail</label>
            <input
              type="email"
              className="w-full p-2 rounded border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-text-secondary">Senha</label>
            <input
              type="password"
              className="w-full p-2 rounded border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Faça Login
          </Link>
        </p>
      </div>
    </div>
  )
}