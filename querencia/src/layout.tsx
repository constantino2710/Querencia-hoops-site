import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function Layout() {
  const { userRoles, signOut } = useAuth()
  const location = useLocation()

  // Definição dos Itens do Menu
  const menuItems = [
    // --- ITENS GERAIS / ALUNO ---
    { 
      label: 'Explorar Cursos', 
      path: '/student/explore', 
      roles: ['STUDENT', 'ADMIN'], // Admin VÊ isso
      icon: '🔍' 
    },
    { 
      label: 'Meu Progresso', 
      path: '/student/dashboard', 
      roles: ['STUDENT'], // Admin NÃO vê isso (removemos 'ADMIN' daqui)
      icon: '📊' 
    },

    // --- ITENS DE PROFESSOR ---
    { 
      label: 'Painel de Vendas', 
      path: '/teacher/dashboard', 
      roles: ['TEACHER'], // Admin NÃO vê
      icon: '💰' 
    },
    { 
      label: 'Meus Cursos', 
      path: '/teacher/courses', 
      roles: ['TEACHER'], // Admin NÃO vê
      icon: '📚' 
    },
    { 
      label: 'Criar Curso', 
      path: '/teacher/create', 
      roles: ['TEACHER'], // Admin NÃO vê
      icon: '➕' 
    },

    // --- ITENS DE ADMIN ---
    { 
      label: 'Dashboard Admin', 
      path: '/admin/dashboard', 
      roles: ['ADMIN'], 
      icon: '🛡️' 
    },
    { 
      label: 'Professores', 
      path: '/admin/teachers', 
      roles: ['ADMIN'], 
      icon: '👨‍🏫' 
    },
    { 
      label: 'Alunos', 
      path: '/admin/students', 
      roles: ['ADMIN'], 
      icon: '🎓' 
    },
  ]

  // Filtra: Mostra o item se o usuário tiver ALGUMA das roles permitidas
  const allowedItems = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  )

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-tight">Plataforma SaaS</h1>
          <div className="mt-2 flex flex-wrap gap-1">
            {userRoles.map(role => (
              <span key={role} className="text-[10px] uppercase bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                {role}
              </span>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {allowedItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 border-l-4 ${
                      isActive 
                        ? 'bg-gray-800 border-blue-500 text-white' 
                        : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition shadow-lg"
          >
             Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8 relative">
        <Outlet />
      </main>
    </div>
  )
}