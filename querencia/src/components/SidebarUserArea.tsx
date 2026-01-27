import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LogOut } from 'lucide-react'

// Interface para receber a prop de colapso
interface SidebarAreaProps {
  isCollapsed?: boolean
}

export function SidebarUserProfile({ isCollapsed }: SidebarAreaProps) {
  const { session, role } = useAuth()
  const user = session?.user

  if (!user) return null

  const getRoleLabel = (r: string | null) => {
    if (r === 'ADMIN') return 'Administrador'
    if (r === 'TEACHER') return 'Professor'
    return 'Estudante'
  }

  return (
    <Link 
      to="/profile"
      title={isCollapsed ? user.user_metadata?.name : ''}
      className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group text-left w-full ${
        isCollapsed ? 'justify-center' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-border shrink-0">
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-text-secondary">
            {user.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Texto - Escondido quando colapsado */}
      {!isCollapsed && (
        <div className="flex-1 min-w-0 overflow-hidden animate-in fade-in duration-300">
          <p className="text-sm font-bold text-text-primary truncate">
            {user.user_metadata?.name || 'Usuário'}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
            {getRoleLabel(role)}
          </p>
        </div>
      )}
    </Link>
  )
}

export function SidebarLogout({ isCollapsed }: SidebarAreaProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <button
      onClick={() => { signOut(); navigate('/login') }}
      title={isCollapsed ? 'Sair' : ''}
      className={`w-full flex items-center gap-3 p-3 text-text-secondary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors rounded-xl mt-1 ${
        isCollapsed ? 'justify-center px-0' : ''
      }`}
    >
      {/* Ícone padronizado */}
      <span className="flex items-center justify-center w-10 shrink-0 text-red-600">
        <LogOut size={20} />
      </span>
      
      {/* Texto - Escondido quando colapsado */}
      {!isCollapsed && (
        <span className="text-sm font-medium animate-in fade-in duration-300 text-red-600">
          Sair
        </span>
      )}
    </button>
  )
}