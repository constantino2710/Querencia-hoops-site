/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from 'react-router-dom'
import { Star, PlayCircle } from 'lucide-react'

interface CourseCardProps {
  course: any
  isEnrolled?: boolean // Propriedade que define se o preço some
}

export function CourseCard({ course, isEnrolled }: CourseCardProps) {
  const navigate = useNavigate()

  // Média de avaliações
  const ratings = course.course_reviews || []
  const averageRating = ratings.length > 0
    ? ratings.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / ratings.length
    : 0

  const formatPrice = (cents: number | null) => {
    if (cents === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format((cents || 0) / 100)
  }

  return (
    <div 
      onClick={() => navigate(`/student/course/${course.id}`)}
      className="group bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
    >
      {/* Miniatura do Curso */}
      <div className="aspect-video w-full bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sem imagem
          </div>
        )}
        
        {/* Overlay para curso já adquirido */}
        {isEnrolled && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle className="w-12 h-12 text-white" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full uppercase tracking-wider">
            {course.categories?.name || 'Geral'}
          </span>
        </div>

        <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs opacity-60">Por {course.teacher?.name}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold">{averageRating.toFixed(1)}</span>
          </div>

          {/* LÓGICA DO PREÇO: Se estiver matriculado, esconde o valor */}
          <div className="font-bold">
            {isEnrolled ? (
              <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded uppercase">
                Já adquirido
              </span>
            ) : (
              <span className="text-blue-600">
                {formatPrice(course.price_cents)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}