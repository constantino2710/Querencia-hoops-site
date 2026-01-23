import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext' // <--- Importe o tema

export function Sidebar() {
  const { userRoles, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme() // <--- Hook do tema
  const location = useLocation()

  // ... (Mantenha sua lista de menuItems igualzinha estava antes) ...
  const menuItems = [
    { label: 'Explorar Cursos', path: '/student/explore', roles: ['STUDENT', 'ADMIN'], icon: '🔍' },
    { label: 'Meu Progresso', path: '/student/dashboard', roles: ['STUDENT'], icon: '📊' },
    { label: 'Dashboard', path: '/teacher/dashboard', roles: ['TEACHER'], icon: '📈' },
    { label: 'Meus Cursos', path: '/teacher/courses', roles: ['TEACHER'], icon: '📚' },
    { label: 'Dashboard Admin', path: '/admin/dashboard', roles: ['ADMIN'], icon: '🛡️' },
    { label: 'Professores', path: '/admin/teachers', roles: ['ADMIN'], icon: '👨‍🏫' },
    { label: 'Alunos', path: '/admin/students', roles: ['ADMIN'], icon: '🎓' },
  ]

  const allowedItems = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  )

  return (
    <aside className="w-64 bg-sidebar-bg text-sidebar-text flex flex-col shadow-xl transition-colors duration-300">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">Plataforma SaaS</h1>
        <div className="mt-2 flex flex-wrap gap-1">
          {userRoles.map(role => (
            <span key={role} className="text-[10px] uppercase bg-gray-700 px-2 py-0.5 rounded text-white">
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

      <div className="p-4 border-t border-gray-700 space-y-3">
        {/* BOTÃO DE TEMA */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition text-white"
        >
          {theme === 'light' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
        </button>

        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition shadow-lg text-white"
        >
          🚪 Sair
        </button>
      </div>
    </aside>
  )
}