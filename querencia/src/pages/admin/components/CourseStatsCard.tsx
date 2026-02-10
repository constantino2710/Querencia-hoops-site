import { Users, Gift, DollarSign } from 'lucide-react'

interface CourseStatsCardProps {
  course: {
    id: string
    title: string
    thumbnail_url: string | null
    status: string | null
    teacher_name: string | null
    category_name: string | null
  }
  stats: {
    totalEnrollments: number
    adminGrants: number
    paidEnrollments: number
    totalRevenue: number // centavos, só de pagos
  }
  onGrantAccess: (courseId: string, courseTitle: string) => void
}

export function CourseStatsCard({ course, stats, onGrantAccess }: CourseStatsCardProps) {
  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  const statusConfig: Record<string, { label: string; color: string }> = {
    PUBLISHED: { label: 'Publicado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    DRAFT: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    ARCHIVED: { label: 'Arquivado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  }

  const status = statusConfig[course.status || 'DRAFT'] || statusConfig.DRAFT

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
          <span className="text-4xl font-bold text-blue-300 dark:text-blue-600">
            {course.title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-bold text-text-primary line-clamp-2 flex-1">{course.title}</h3>
          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Meta */}
        <div className="space-y-1 mb-4">
          {course.teacher_name && (
            <p className="text-xs text-text-secondary">Prof. {course.teacher_name}</p>
          )}
          {course.category_name && (
            <p className="text-xs text-text-secondary">{course.category_name}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-text-secondary mb-1">Alunos</p>
            <p className="text-sm font-bold text-text-primary">{stats.totalEnrollments}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-text-secondary mb-1">Concessões</p>
            <p className="text-sm font-bold text-text-primary">{stats.adminGrants}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-text-secondary mb-1">Receita</p>
            <p className="text-sm font-bold text-text-primary">{formatBRL(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => onGrantAccess(course.id, course.title)}
          className="w-full px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          Conceder Acesso
        </button>
      </div>
    </div>
  )
}
