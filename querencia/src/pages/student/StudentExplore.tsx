/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { SearchBar } from '../../components/searchBar'
import { CourseCard } from './components/CourseCard'

interface CoursePreview {
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

  // Lógica de filtragem baseada no termo de pesquisa
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
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Busque por título, categoria ou assunto..."
            />
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
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}