import { useState } from 'react'
import type { CourseWithDetails } from './TeacherCourseCard'
import { EditCourseInfo } from './editCourseInfo'
import { EditCourseContent } from './editCourseContent'

interface EditCourseModalProps {
  course: CourseWithDetails | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function EditCourseModal({ course, isOpen, onClose, onUpdate }: EditCourseModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info')

  if (!isOpen || !course) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl border border-border overflow-hidden">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-surface z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Editar Curso</h2>
            <p className="text-sm text-text-secondary mt-1">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-border bg-surface shrink-0 px-6 gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Informações Básicas
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Conteúdo do Curso (Aulas)
          </button>
        </div>

        {/* Corpo do Modal (Conteúdo das Abas) */}
        <div className="flex-1 overflow-y-auto bg-background/50 p-6 custom-scrollbar">
          {activeTab === 'info' ? (
            <EditCourseInfo course={course} onUpdate={onUpdate} onClose={onClose} />
          ) : (
            <EditCourseContent courseId={course.id} />
          )}
        </div>

      </div>
    </div>
  )
}