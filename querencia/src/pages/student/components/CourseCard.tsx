/* eslint-disable @typescript-eslint/no-explicit-any */
import { ShoppingCart, CheckCircle, User } from 'lucide-react'
import { useCart } from '../../../CartContext'

interface CourseCardProps {
  course: any
  isEnrolled?: boolean // Propriedade para controlar o estado de posse
}

export function CourseCard({ course, isEnrolled }: CourseCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    if (isEnrolled) return

    addItem({
      id: course.id,
      title: course.title,
      priceCents: course.price_cents,
      thumbnailUrl: course.thumbnail_url,
      teacherName: course.users?.name || 'Professor',
      teacherId: course.teacher_id
    })
  }

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-lg">
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-secondary">
            Sem imagem
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex flex-1 flex-col">
          <h3 className="mb-2 text-lg font-bold text-text-primary line-clamp-2">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <User size={16} />
            <span>{course.users?.name || 'Professor'}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {isEnrolled ? '—' : formatPrice(course.price_cents)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isEnrolled}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              isEnrolled
                ? 'bg-green-100 text-green-700 cursor-not-allowed dark:bg-green-900/30 dark:text-green-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isEnrolled ? (
              <>
                <CheckCircle size={18} />
                Já possui
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                Carrinho
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}