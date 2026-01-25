/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { CourseCard } from './components/CourseCard'

interface EnrolledCourse {
  id: string
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

export default function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyCourses()
  }, [])

  async function fetchMyCourses() {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course:courses (
            id,
            title,
            thumbnail_url,
            price_cents,
            categories(name, slug),
            teacher:users!fk_courses_teacher(name, avatar_url),
            course_reviews(rating)
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'ACTIVE')

      if (error) throw error
      
      if (data) {
        setEnrolledCourses(data as unknown as EnrolledCourse[])
      }
      
    } catch (error: any) {
      console.error('Erro ao buscar seus cursos:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : enrolledCourses.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-xl border-2 border-dashed border-border">
          <p className="text-xl opacity-60 text-text-secondary">Você ainda não possui nenhum curso.</p>
          <a 
            href="/student/explore" 
            className="mt-4 inline-block text-blue-600 hover:underline font-medium"
          >
            Explorar catálogo de cursos
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrolledCourses.map((item) => (
            <CourseCard 
              key={item.id} 
              course={item.course} 
              isEnrolled={true} // Aplica a lógica para esconder o preço
            />
          ))}
        </div>
      )}
    </div>
  )
}