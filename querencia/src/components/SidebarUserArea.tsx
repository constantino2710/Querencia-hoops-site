import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export function SidebarUserProfile() {
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
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group text-left w-full"
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

      {/* Texto */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-bold text-text-primary truncate">
          {user.user_metadata?.name || 'Usuário'}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
          {getRoleLabel(role)}
        </p>
      </div>
    </Link>
  )
}

export function SidebarLogout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <button
      onClick={() => { signOut(); navigate('/login') }}
      className="w-full flex items-center gap-3 p-3 text-text-secondary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors rounded-xl mt-1"
    >
      <span className="w-10 flex justify-center text-lg">🚪</span>
      <span className="text-sm font-medium">Sair</span>
    </button>
  )
}