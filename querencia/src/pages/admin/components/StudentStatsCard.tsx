import { BookOpen, DollarSign } from 'lucide-react'

interface StudentStatsCardProps {
  student: {
    id: string
    name: string | null
    email: string
    avatar_url: string | null
    is_active: boolean | null
  }
  stats: {
    enrollmentsCount: number  // cursos matriculados (ACTIVE)
    totalSpent: number        // total gasto em centavos
  }
}

export function StudentStatsCard({ student, stats }: StudentStatsCardProps) {
  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name ?? undefined}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold">
            {getInitials(student.name || 'ND')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-text-primary truncate">{student.name || 'Nome não disponível'}</h3>
          <p className="text-sm text-text-secondary truncate">{student.email}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
              student.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}
          >
            {student.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-text-secondary mb-1">Cursos</p>
          <p className="text-sm font-bold text-text-primary">{stats.enrollmentsCount}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-text-secondary mb-1">Total Gasto</p>
          <p className="text-sm font-bold text-text-primary">{formatBRL(stats.totalSpent)}</p>
        </div>
      </div>
    </div>
  )
}
