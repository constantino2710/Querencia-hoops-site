import { useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useCart } from '../CartContext'
import { Bell, ShoppingCart } from 'lucide-react'

export function Header() {
  const location = useLocation()
  const { role, userRoles } = useAuth()
  const { items, openCart } = useCart()

  const pageTitles: Record<string, string> = {
    '/student/explore': 'Explorar Cursos',
    '/student/dashboard': 'Meu Aprendizado',
    '/teacher/dashboard': 'Dashboard Professor',
    '/teacher/courses': 'Meus Cursos',
    '/admin/dashboard': 'Painel Admin',
    '/admin/teachers': 'Gestão de Professores',
    '/admin/students': 'Gestão de Alunos',
    '/profile': 'Meu Perfil'
  }

  const currentTitle = pageTitles[location.pathname] || 'Hoops Hub'

  const getBorderColor = () => {
    if (userRoles?.includes('ADMIN')) return 'border-red-500'
    if (userRoles?.includes('TEACHER')) return 'border-purple-500'
    return 'border-blue-500'
  }

  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 shadow-sm shrink-0 transition-colors duration-300">
      
      <div className={`pl-3 border-l-4 ${getBorderColor()}`}>
        <h2 className="text-xl font-bold text-text-primary">{currentTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
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

        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold text-text-secondary">
          U
        </div>
      </div>
    </header>
  )
}