/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/student/components/CourseCard.tsx
import { Link } from 'react-router-dom'
import { getCategoryIcon, getCategoryColor } from '../../../utils/categoryHelper'

interface CourseCardProps {
  course: {
    id: string
    title: string
    thumbnail_url: string | null
    price_cents: number | null
    categories: { name: string; slug: string } | null
    teacher: { 
      name: string
      avatar_url: string | null 
    } | null
    course_reviews: { rating: number | null }[]
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const getRating = (reviews: any[]) => {
    const valid = reviews.filter(r => r.rating !== null)
    return valid.length ? valid.reduce((acc, curr) => acc + (curr.rating || 0), 0) / valid.length : 0
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  return (
    <Link 
      to={`/student/courses/${course.id}`}
      className="group bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary text-sm">Sem imagem</div>
        )}
        {course.categories && (
          <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm backdrop-blur-md bg-opacity-90 ${getCategoryColor(course.categories.slug)}`}>
            <span>{getCategoryIcon(course.categories.slug)}</span>
            <span>{course.categories.name}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-text-primary line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        
        {/* EXIBIÇÃO DO AVATAR DO PROFESSOR */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-border">
            {course.teacher?.avatar_url ? (
              <img src={course.teacher.avatar_url} alt="Prof" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 text-[10px] font-bold">
                {course.teacher?.name?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
          </div>
          <p className="text-sm text-text-secondary truncate font-medium">
            Prof. {course.teacher?.name || 'Instrutor'}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-yellow-500">★</span>
            <span className="font-medium text-text-primary">{getRating(course.course_reviews).toFixed(1)}</span>
          </div>
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {formatPrice(course.price_cents)}
          </span>
        </div>
      </div>
    </Link>
  )
}