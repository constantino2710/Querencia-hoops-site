import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext'
import { SidebarUserProfile, SidebarLogout } from './SidebarUserArea'

// 1. Importando os ícones do Lucide
import { 
  LayoutDashboard, 
  Search, 
  BookOpen, 
  Users, 
  UserCog 
} from 'lucide-react'

export function Sidebar() {
  const { role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const menuItems = [
    // --- ESTUDANTE ---
      { 
      label: 'Meu Aprendizado', 
      path: '/student/dashboard', 
      roles: ['STUDENT'], 
      // Aqui usei o LayoutDashboard também, pois é o dashboard do aluno
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      label: 'Explorar Cursos', 
      path: '/student/explore', 
      roles: ['STUDENT'], 
      icon: <Search size={20} /> // Ícone de Lupa
    },


    // --- PROFESSOR ---
    { 
      label: 'Dashboard', 
      path: '/teacher/dashboard', 
      roles: ['TEACHER'], 
      // O ícone pedido
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      label: 'Meus Cursos', 
      path: '/teacher/courses', 
      roles: ['TEACHER'], 
      icon: <BookOpen size={20} /> 
    },

    // --- ADMIN ---
    { 
      label: 'Visão Geral', 
      path: '/admin/dashboard', 
      roles: ['ADMIN'], 
      // O ícone pedido (Admin Dashboard)
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      label: 'Professores', 
      path: '/admin/teachers', 
      roles: ['ADMIN'], 
      icon: <UserCog size={20} /> 
    },
    { 
      label: 'Alunos', 
      path: '/admin/students', 
      roles: ['ADMIN'], 
      icon: <Users size={20} /> 
    },
  ]

  const allowedItems = menuItems.filter(item => 
    role && item.roles.includes(role)
  )

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                QH
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Hoops Hub</h1>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Menu */}
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
              {/* Renderiza o componente do ícone diretamente */}
              <span className={`flex items-center justify-center ${isActive ? '' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-gray-800/20 shrink-0 flex flex-col gap-1 mt-auto">
        <SidebarUserProfile />
        <SidebarLogout />
      </div>
    </aside>
  )
}