/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { SearchBar } from '../../components/searchBar'
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryHelper'

interface CoursePreview {
  id: string
  title: string
  thumbnail_url: string | null
  price_cents: number | null
  categories: { name: string; slug: string } | null
  // Relação com Usuário (Professor)
  teacher: { 
    name: string
    avatar_url: string | null 
  } | null
  course_reviews: { rating: number | null }[]
}

export default function StudentExplore() {
  const [courses, setCourses] = useState<CoursePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPublishedCourses()
  }, [])

  async function fetchPublishedCourses() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories(name, slug),
          teacher:users!fk_courses_teacher(name, avatar_url), 
          course_reviews(rating)
        `)
        // ^^^ CORREÇÃO CRÍTICA: !fk_courses_teacher resolve o erro PGRST201
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setCourses(data as unknown as CoursePreview[])
      
    } catch (error: any) {
      console.error('Erro ao buscar cursos:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos Auxiliares
  const getRating = (reviews: any[]) => {
    const valid = reviews.filter(r => r.rating !== null)
    if (!valid.length) return 0
    return valid.reduce((acc, curr) => acc + (curr.rating || 0), 0) / valid.length
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  // Filtro de Pesquisa
  const filteredCourses = courses.filter(course => {
    const term = searchTerm.toLowerCase()
    return (
      course.title.toLowerCase().includes(term) ||
      (course.categories?.name && course.categories.name.toLowerCase().includes(term))
    )
  })

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] w-full">
      <div className="mb-6 shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Busque por título, categoria ou assunto..."/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
           <div className="flex justify-center items-center h-40">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
           </div>
        ) : filteredCourses.length === 0 ? (
           <div className="text-center py-12 opacity-70">
             <p className="text-xl">Nenhum curso encontrado.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
            {filteredCourses.map(course => (
              <Link 
                key={course.id} 
                to={`/student/courses/${course.id}`}
                className="group bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                {/* Imagem */}
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

                {/* Conteúdo */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-text-primary line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  {/* Info Professor */}
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

                  {/* Rodapé Card */}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}