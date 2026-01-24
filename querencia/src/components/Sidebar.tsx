import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext'
import { SidebarUserProfile, SidebarLogout } from './SidebarUserArea'

export function Sidebar() {
  const { role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const menuItems = [
    // --- ÁREA DO ESTUDANTE (Visível APENAS para Student) ---
    { 
      label: 'Explorar Cursos', 
      path: '/student/explore', 
      roles: ['STUDENT'], // <--- CORRIGIDO: Só estudante vê
      icon: '🔍' 
    },
    { 
      label: 'Meu Aprendizado', 
      path: '/student/dashboard', 
      roles: ['STUDENT'], 
      icon: '🎓' 
    },

    // --- ÁREA DO PROFESSOR ---
    { 
      label: 'Dashboard', 
      path: '/teacher/dashboard', 
      roles: ['TEACHER'], 
      icon: '📈' 
    },
    { 
      label: 'Meus Cursos', 
      path: '/teacher/courses', 
      roles: ['TEACHER'], 
      icon: '📚' 
    },

    // --- ÁREA DO ADMIN ---
    { 
      label: 'Visão Geral', 
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

  // Filtra itens
  const allowedItems = menuItems.filter(item => 
    role && item.roles.includes(role)
  )

  return (
    // Sidebar fixa com largura definida (w-64)
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      
      {/* 1. Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                QH
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Querênciahoops</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* 2. Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        {allowedItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold shadow-sm' 
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-primary'
              }`}
            >
              <span className={`text-lg ${isActive ? '' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 3. Rodapé */}
      <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-gray-800/20 shrink-0 flex flex-col gap-1 mt-auto">
        <SidebarUserProfile />
        <SidebarLogout />
      </div>
    </aside>
  )
}