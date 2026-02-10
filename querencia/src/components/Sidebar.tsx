import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { SidebarUserProfile, SidebarLogout } from './SidebarUserArea'
import { LayoutDashboard, Search, BookOpen, Users, UserCog, ChevronLeft, ChevronRight, Settings, Database } from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { role } = useAuth()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  const isCompact = isCollapsed || isMobile

  const menuItems = [
    { label: 'Meu Aprendizado', path: '/student/dashboard', roles: ['STUDENT'], icon: <LayoutDashboard size={20} /> },
    { label: 'Explorar Cursos', path: '/student/explore', roles: ['STUDENT'], icon: <Search size={20} /> },
    { label: 'Dashboard', path: '/teacher/dashboard', roles: ['TEACHER'], icon: <LayoutDashboard size={20} /> },
    { label: 'Meus Cursos', path: '/teacher/courses', roles: ['TEACHER'], icon: <BookOpen size={20} /> },
    { label: 'Visão Geral', path: '/admin/dashboard', roles: ['ADMIN'], icon: <LayoutDashboard size={20} /> },
    { label: 'Professores', path: '/admin/teachers', roles: ['ADMIN'], icon: <UserCog size={20} /> },
    { label: 'Alunos', path: '/admin/students', roles: ['ADMIN'], icon: <Users size={20} /> },
    { label: 'Integridade de Dados', path: '/admin/data-integrity', roles: ['ADMIN'], icon: <Database size={20} /> },
    { label: 'Configurações', path: '/admin/settings', roles: ['ADMIN'], icon: <Settings size={20} /> },
  ]

  const allowedItems = menuItems.filter((item) => role && item.roles.includes(role))

  return (
    <aside
      className={`bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 w-20 ${
        isCollapsed ? 'md:w-20' : 'md:w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-3 md:px-4 border-b border-border shrink-0 overflow-hidden">
        {!isCompact && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              QH
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight whitespace-nowrap">Hoops Hub</h1>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-2 md:px-4 space-y-1.5 custom-scrollbar">
        {allowedItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCompact ? item.label : ''}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-primary'
              } ${isCompact ? 'justify-center px-0' : ''}`}
            >
              <span
                className={`flex items-center justify-center shrink-0 ${
                  isActive ? '' : 'opacity-70 group-hover:opacity-100 transition-opacity'
                }`}
              >
                {item.icon}
              </span>
              {!isCompact && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div
        className={`p-4 border-t border-border bg-gray-50/50 dark:bg-gray-800/20 shrink-0 flex flex-col gap-1 mt-auto ${
          isCompact ? 'items-center px-2' : ''
        }`}
      >
        <SidebarUserProfile isCollapsed={isCompact} />
        <SidebarLogout isCollapsed={isCompact} />
      </div>
    </aside>
  )
}
