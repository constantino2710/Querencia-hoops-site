import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface UserRole {
  roles: {
    name: string
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userRoles, setUserRoles] = useState<string[]>([])

  useEffect(() => {
    async function getUserData() {
      // 1. Verifica usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 2. Busca nome do perfil
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()
      
      if (profile?.name) setUserName(profile.name)

      // 3. Busca os cargos (roles)
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('roles(name)') // Join para pegar o nome da role
        .eq('user_id', user.id)

      // Transforma o retorno complexo em um array simples: ['STUDENT', 'ADMIN']
      if (rolesData) {
        const roles = rolesData.map((item: UserRole) => item.roles.name)
        setUserRoles(roles)
      }

      setLoading(false)
    }

    getUserData()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // --- LÓGICA DE PERMISSÃO ---
  // O Admin é o "Super Usuário", então ele geralmente vê tudo.
  const isAdmin = userRoles.includes('ADMIN')
  const isTeacher = userRoles.includes('TEACHER')
  const isStudent = userRoles.includes('STUDENT')

  if (loading) return <div className="p-10">Carregando permissões...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-10 font-sans">
      
      {/* CABEÇALHO: MOSTRA OS CARGOS */}
      <div className="mb-10 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-2">Painel de Controle</h1>
        <p className="text-gray-600 mb-4">Bem-vindo, <strong>{userName}</strong></p>
        
        <div className="flex items-center gap-3">
          <span>Seus cargos identificados no banco:</span>
          <div className="flex gap-2">
            {userRoles.length === 0 && <span className="text-red-500">Nenhum cargo definido</span>}
            
            {userRoles.map(role => (
              <span key={role} className="px-3 py-1 bg-gray-800 text-white text-sm font-bold rounded">
                {role}
              </span>
            ))}
          </div>
        </div>

        <button onClick={handleLogout} className="mt-4 text-red-600 underline text-sm">
          Sair do sistema
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-700 border-b pb-2">Teste de Permissões:</h2>

        {/* 1. TEXTO APENAS PARA ADMINS */}
        {isAdmin && (
          <div className="p-6 bg-red-100 border-l-4 border-red-600 rounded">
            <h3 className="text-red-800 font-bold text-lg mb-1">🔒 TEXTO SECRETO DE ADMIN</h3>
            <p className="text-red-700">
              Se você está lendo isso, você é um <strong>ADMINISTRADOR</strong>. 
              Aqui ficam configurações sensíveis, financeiro global e botões de deletar usuários.
            </p>
          </div>
        )}

        {/* 2. TEXTO PARA PROFESSORES (E ADMINS) */}
        {(isTeacher || isAdmin) && (
          <div className="p-6 bg-purple-100 border-l-4 border-purple-600 rounded">
            <h3 className="text-purple-800 font-bold text-lg mb-1">👨‍🏫 TEXTO DE PROFESSORES</h3>
            <p className="text-purple-700">
              Esta área é visível para <strong>Professores</strong> e Admins.
              Aqui aparecem ferramentas de criar cursos, ver alunos matriculados e lançar notas.
            </p>
          </div>
        )}

        {/* 3. TEXTO PARA ESTUDANTES (E ADMINS) */}
        {(isStudent || isAdmin) && (
          <div className="p-6 bg-blue-100 border-l-4 border-blue-600 rounded">
            <h3 className="text-blue-800 font-bold text-lg mb-1">🎓 TEXTO DE ESTUDANTES</h3>
            <p className="text-blue-700">
              Esta área é visível para <strong>Estudantes</strong> e Admins.
              Aqui fica a lista de cursos comprados, certificados e aulas para assistir.
            </p>
          </div>
        )}
        
      </div>
    </div>
  )
}