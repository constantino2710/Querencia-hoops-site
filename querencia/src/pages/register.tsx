import { useState } from 'react'
import { supabase } from '../supabaseClient'

type RoleOption = 'STUDENT' | 'TEACHER'

export function Register() {
  const [role, setRole] = useState<RoleOption>('STUDENT')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          intended_role: role,
        },
      },
    })

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      setMsg('Verifique seu e-mail para confirmar o cadastro!')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Crie sua conta</h1>

        {/* Botões de Seleção */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              role === 'STUDENT' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👨‍🎓 Sou Aluno
          </button>
          <button
            type="button"
            onClick={() => setRole('TEACHER')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              role === 'TEACHER' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👨‍🏫 Sou Professor
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: João da Silva"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="********"
            />
          </div>
          <div>
            já tem uma conta? <a href="/login" className="text-blue-600 hover:underline">Faça login</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        {msg && (
          <div className={`mt-4 p-3 rounded-md text-sm text-center ${
            msg.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}