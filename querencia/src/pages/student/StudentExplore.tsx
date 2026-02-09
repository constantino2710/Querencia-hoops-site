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
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      // 1. Obter o utilizador atual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 2. Procurar cursos onde o aluno já está matriculado (apenas ACTIVE)
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', user.id)
          .eq('status', 'ACTIVE')

        if (enrollError) throw enrollError
        
        if (enrollments) {
          const ids = new Set(enrollments.map(e => e.course_id))
          setEnrolledCourseIds(ids)
        }
      }

      // 3. Procurar todos os cursos publicados
      await fetchPublishedCourses()
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPublishedCourses() {
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
  }

  // Lógica de filtragem: Termo de pesquisa + Não estar matriculado
  const filteredCourses = courses.filter(course => {
    // Regra 1: Não exibir se já estiver matriculado
    if (enrolledCourseIds.has(course.id)) {
      return false
    }

    // Regra 2: Termo de pesquisa
    const term = searchTerm.toLowerCase()
    return (
      course.title.toLowerCase().includes(term) ||
      (course.categories?.name && course.categories.name.toLowerCase().includes(term))
    )
  })

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <div className="mb-6 shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Busque por título, categoria ou assunto..."
            />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
           <div className="flex justify-center items-center h-40">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
           </div>
        ) : filteredCourses.length === 0 ? (
           <div className="text-center py-12 opacity-70">
             <p className="text-xl">Nenhum curso novo encontrado para si.</p>
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