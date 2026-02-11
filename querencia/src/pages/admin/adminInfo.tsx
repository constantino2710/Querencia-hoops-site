import { useState } from 'react'
import AdminCourses from './AdminCourses'
import AdminTeachers from './AdminTeachers'
import AdminStudents from './AdminStudents'
import { BookOpen, UserCog, Users } from 'lucide-react'

export default function AdminInfo() {
  const [activeTab, setActiveTab] = useState<'courses' | 'teachers' | 'students'>('courses')

  const tabs = [
    { id: 'courses', label: 'Cursos', icon: <BookOpen size={18} />, component: <AdminCourses /> },
    { id: 'teachers', label: 'Professores', icon: <UserCog size={18} />, component: <AdminTeachers /> },
    { id: 'students', label: 'Estudantes', icon: <Users size={18} />, component: <AdminStudents /> },
  ] as const

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-surface rounded-lg border border-border overflow-hidden transition-colors duration-300">
      {/* Navegação por Abas */}
      <div className="flex border-b border-border bg-gray-50/50 dark:bg-gray-800/20 px-2 md:px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 animate-in fade-in zoom-in duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="flex-1 overflow-hidden">
        {tabs.find((t) => t.id === activeTab)?.component}
      </div>
    </div>
  )
}