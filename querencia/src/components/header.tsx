import { useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useCart } from '../CartContext'
import { useTheme } from '../ThemeContext'
import { Bell, ShoppingCart, Sun, Moon } from 'lucide-react'

export function Header() {
  const location = useLocation()
  const { role, userRoles } = useAuth()
  const { items, openCart } = useCart()
  const { theme, toggleTheme } = useTheme()

  const pageTitles: Record<string, string> = {
    '/student/explore': 'Explorar Cursos',
    '/student/dashboard': 'Meu Aprendizado',
    '/teacher/dashboard': 'Dashboard Professor',
    '/teacher/courses': 'Meus Cursos',
    '/admin/dashboard': 'Painel Admin',
    '/admin/teachers': 'Gestão de Professores',
    '/admin/students': 'Gestão de Alunos',
    '/profile': 'Meu Perfil',
  }

  const currentTitle = pageTitles[location.pathname] || 'Hoops Hub'

  const getBorderColor = () => {
    if (userRoles?.includes('ADMIN')) return 'border-red-500'
    if (userRoles?.includes('TEACHER')) return 'border-purple-500'
    return 'border-blue-500'
  }

  const isDark = theme === 'dark'

  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 shadow-sm shrink-0 transition-colors duration-300">
      <div className={`pl-3 border-l-4 ${getBorderColor()}`}>
        <h2 className="text-xl font-bold text-text-primary">{currentTitle}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Switch de tema (sem biblioteca) */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="Alternar tema"
          onClick={toggleTheme}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleTheme()
            }
          }}
          className={`relative inline-flex h-9 w-16 items-center rounded-full border border-border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
            ${isDark ? 'bg-gray-900' : 'bg-white'}
          `}
        >
          {/* Ícones dentro do switch */}
          <span className={`absolute left-2 z-10 transition-opacity ${isDark ? 'opacity-40' : 'opacity-100'}`}>
            <Sun size={16} className="text-text-secondary" />
          </span>
          <span className={`absolute right-2 z-10 transition-opacity ${isDark ? 'opacity-100' : 'opacity-40'}`}>
            <Moon size={16} className="text-text-secondary" />
          </span>

          {/* Bolinha */}
          <span
            className={`absolute z-20 h-7 w-7 rounded-full shadow transition-transform bg-blue-600
              ${isDark ? 'translate-x-8' : 'translate-x-1'}
            `}
          />
        </button>

        {/* Carrinho visível apenas para Estudantes */}
        {role === 'STUDENT' && (
          <button
            onClick={openCart}
            className="relative p-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ShoppingCart size={20} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.25rem] rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white text-center">
                {items.length}
              </span>
            )}
          </button>
        )}

        <button className="p-2 rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
        </button>
      </div>
    </header>
  )
}
