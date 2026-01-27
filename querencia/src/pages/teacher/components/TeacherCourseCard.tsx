import type { Database } from '../../../database.types'
import { getCategoryIcon, getCategoryColor } from '../../../utils/categoryHelper'

export type CourseWithDetails = Database['public']['Tables']['courses']['Row'] & {
  course_reviews: { rating: number | null }[]
  categories: { name: string; slug: string } | null
}

interface TeacherCourseCardProps {
  course: CourseWithDetails
  onEdit: (course: CourseWithDetails) => void // Recebe a função de editar
}

export function TeacherCourseCard({ course, onEdit }: TeacherCourseCardProps) {
  const getAverageRating = (reviews: { rating: number | null }[]) => {
    const validReviews = reviews.filter((r) => r.rating !== null)
    if (validReviews.length === 0) return 0
    const sum = validReviews.reduce((acc, curr) => acc + (curr.rating || 0), 0)
    return sum / validReviews.length
  }
    const getRatingCount = (reviews: { rating: number | null }[]) => {
    return reviews.filter((review) => review.rating !== null).length
  }


  const formatPrice = (priceCents: number | null) => {
    if (priceCents === null || priceCents === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceCents / 100)
  }

  const renderStatusBadge = (status: string | null) => {
    const config = status === 'PUBLISHED' 
      ? { label: 'Publicado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
      : status === 'ARCHIVED'
      ? { label: 'Arquivado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
      : { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' }
    
    return <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${config.color}`}>{config.label}</span>
  }

  const rating = getAverageRating(course.course_reviews)
  const ratingCount = getRatingCount(course.course_reviews)
  const categorySlug = course.categories?.slug

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
      
      {/* Imagem */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary text-sm">Sem imagem</div>
        )}
        <div className="absolute top-2 right-2">{renderStatusBadge(course.status)}</div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-text-primary line-clamp-2 leading-tight" title={course.title}>
          {course.title}
        </h3>

        {/* Categoria (Logo abaixo do título) */}
        {course.categories && (
          <div className="mt-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(categorySlug)}`}>
              <span>{getCategoryIcon(categorySlug)}</span>
              <span>{course.categories.name}</span>
            </span>
          </div>
        )}

        {/* Avaliação */}
        <div className="flex items-center gap-1 mb-4 text-sm mt-auto pt-2">
          <span className="text-yellow-500">★</span>
          <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
          <span className="text-text-secondary text-xs ml-1">({ratingCount})</span>
        </div>

        {/* Rodapé: Preço e Botão */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {formatPrice(course.price_cents)}
          </span>
          
          <button
            onClick={() => onEdit(course)}
            className="text-sm font-medium text-text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline"
          >
            Gerenciar
          </button>
        </div>
      </div>
    </div>
  )
}