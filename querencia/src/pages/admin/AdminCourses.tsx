/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { CourseStatsCard } from './components/CourseStatsCard'
import { AdminGrantModal } from './components/AdminGrantModal'

interface CourseWithStats {
  id: string
  title: string
  thumbnail_url: string | null
  status: string | null
  teacher_name: string | null
  category_name: string | null
  stats: {
    totalEnrollments: number
    adminGrants: number
    paidEnrollments: number
    totalRevenue: number
  }
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>()
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string | undefined>()

  useEffect(() => {
    fetchCoursesData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredCourses(
        courses.filter(
          (c) =>
            c.title.toLowerCase().includes(term) ||
            c.teacher_name?.toLowerCase().includes(term) ||
            c.category_name?.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, courses])

  async function fetchCoursesData() {
    try {
      setLoading(true)

      // 1. Buscar todos os cursos
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, status, teacher_id, category_id')

      if (!coursesData || coursesData.length === 0) {
        setCourses([])
        setFilteredCourses([])
        return
      }

      // 2. Buscar professores
      const teacherIds = [...new Set(coursesData.map((c) => c.teacher_id))]
      const { data: teachers } = await supabase
        .from('users')
        .select('id, name')
        .in('id', teacherIds)

      const teacherMap = new Map(teachers?.map((t) => [t.id, t.name]) || [])

      // 3. Buscar categorias
      const categoryIds = coursesData.map((c) => c.category_id).filter(Boolean) as string[]
      let categoryMap = new Map<string, string>()
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', categoryIds)
        categoryMap = new Map(categories?.map((c) => [c.id, c.name]) || [])
      }

      // 4. Buscar enrollments ativos
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, is_admin_grant, price_paid_cents')
        .eq('status', 'ACTIVE')

      // 5. Agregar stats por curso
      const coursesWithStats: CourseWithStats[] = coursesData.map((course) => {
        const courseEnrollments = enrollments?.filter((e) => e.course_id === course.id) || []
        const adminGrants = courseEnrollments.filter((e) => e.is_admin_grant).length
        const paidEnrollments = courseEnrollments.filter((e) => !e.is_admin_grant)
        const totalRevenue = paidEnrollments.reduce((acc, e) => acc + (e.price_paid_cents || 0), 0)

        return {
          id: course.id,
          title: course.title,
          thumbnail_url: course.thumbnail_url,
          status: course.status,
          teacher_name: teacherMap.get(course.teacher_id) || null,
          category_name: course.category_id ? categoryMap.get(course.category_id) || null : null,
          stats: {
            totalEnrollments: courseEnrollments.length,
            adminGrants,
            paidEnrollments: paidEnrollments.length,
            totalRevenue,
          },
        }
      })

      // Ordenar: publicados primeiro, depois por alunos
      coursesWithStats.sort((a, b) => {
        if (a.status === 'PUBLISHED' && b.status !== 'PUBLISHED') return -1
        if (a.status !== 'PUBLISHED' && b.status === 'PUBLISHED') return 1
        return b.stats.totalEnrollments - a.stats.totalEnrollments
      })

      setCourses(coursesWithStats)
      setFilteredCourses(coursesWithStats)
    } catch (error: any) {
      console.error('Erro ao carregar cursos:', error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleGrantAccess(courseId: string, courseTitle: string) {
    setSelectedCourseId(courseId)
    setSelectedCourseTitle(courseTitle)
    setGrantModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border transition-colors duration-300 h-[calc(100vh-200px)] flex flex-col">
      {/* Cabeçalho fixo */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Cursos da Plataforma</h2>
            <p className="text-sm text-text-secondary mt-1">
              Total: {courses.length} curso{courses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <input
            type="text"
            placeholder="Buscar curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-border bg-background text-text-primary rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors max-w-xs"
          />
        </div>
      </div>

      {/* Área com scroll */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              {searchTerm ? 'Nenhum curso encontrado com esse termo.' : 'Nenhum curso cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseStatsCard
                key={course.id}
                course={course}
                stats={course.stats}
                onGrantAccess={handleGrantAccess}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Concessão */}
      <AdminGrantModal
        isOpen={grantModalOpen}
        onClose={() => {
          setGrantModalOpen(false)
          setSelectedCourseId(undefined)
          setSelectedCourseTitle(undefined)
        }}
        onSuccess={fetchCoursesData}
        preSelectedCourseId={selectedCourseId}
        preSelectedCourseTitle={selectedCourseTitle}
      />
    </div>
  )
}
