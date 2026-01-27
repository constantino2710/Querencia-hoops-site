/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpenCheck } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { CourseCard } from './components/CourseCard'
import { StatCard } from './/components/StatCard'
import { getStoredCourseProgress } from './utils/courseProgress'

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
    course_sections?: {
      lessons?: { id: string }[]
    }[]
  }
}

export default function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    fetchMyCourses()
  }, [])

  async function fetchMyCourses() {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

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
            course_reviews(rating),
            course_sections(lessons(id))
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

  const progressByCourse = useMemo(() => {
    if (!userId) return new Map()
    const entries = enrolledCourses.map((item) => {
      const lessons = item.course.course_sections?.flatMap((section) => section.lessons ?? []) ?? []
      const lessonIds = lessons.map((lesson) => lesson.id)
      const progress = getStoredCourseProgress(userId, item.course.id, lessonIds)
      return [item.course.id, progress] as const
    })
    return new Map(entries)
  }, [enrolledCourses, userId])

  const { totalCourses, averageProgress } = useMemo(() => {
    const total = enrolledCourses.length
    if (!total) return { totalCourses: 0, averageProgress: 0 }

    const progressValues = enrolledCourses.map((item) => {
      const progress = progressByCourse.get(item.course.id)
      return progress?.percent ?? 0
    })

    const sum = progressValues.reduce((acc, value) => acc + value, 0)
    const avg = Math.round(sum / total)
    return { totalCourses: total, averageProgress: avg }
  }, [enrolledCourses, progressByCourse])

  return (
    <div className="flex flex-col w-full h-full min-h-0">
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Cursos comprados"
              value={totalCourses.toString()}
              helper="Total de cursos ativos"
              icon={<BookOpenCheck className="h-5 w-5" />}
            />
            <StatCard
              title="Média de conclusão"
              value={`${averageProgress}%`}
              helper="Média calculada pelos seus cursos"
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolledCourses.map((item) => (
              <CourseCard
                key={item.id}
                course={item.course}
                isEnrolled={true}
                progress={progressByCourse.get(item.course.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}