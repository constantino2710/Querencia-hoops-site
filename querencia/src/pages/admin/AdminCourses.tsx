/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { AdminGrantModal } from './components/AdminGrantModal'
import { Plus, Search, BookOpen } from 'lucide-react'

interface CourseWithStats {
  id: string
  title: string
  thumbnail_url: string | null
  status: string | null
  teacher_name: string | null
  price_cents: number | null
  stats: { totalEnrollments: number; totalRevenue: number }
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => { fetchCoursesData() }, [])

  useEffect(() => {
    const term = searchTerm.toLowerCase()
    setFilteredCourses(courses.filter(c => c.title.toLowerCase().includes(term) || c.teacher_name?.toLowerCase().includes(term)))
  }, [searchTerm, courses])

  async function fetchCoursesData() {
    try {
      setLoading(true)
      const { data: coursesData } = await supabase.from('courses').select('id, title, thumbnail_url, status, teacher_id, price_cents')
      if (!coursesData) return

      const teacherIds = [...new Set(coursesData.map(c => c.teacher_id))]
      const { data: teachers } = await supabase.from('users').select('id, name').in('id', teacherIds)
      const teacherMap = new Map(teachers?.map(t => [t.id, t.name]) || [])

      const { data: enrollments } = await supabase.from('enrollments').select('course_id, price_paid_cents').eq('status', 'ACTIVE')

      const formatted = coursesData.map(course => {
        const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || []
        return {
          id: course.id,
          title: course.title,
          thumbnail_url: course.thumbnail_url,
          status: course.status,
          teacher_name: teacherMap.get(course.teacher_id) || 'N/A',
          price_cents: course.price_cents,
          stats: {
            totalEnrollments: courseEnrollments.length,
            totalRevenue: courseEnrollments.reduce((acc, e) => acc + (e.price_paid_cents || 0), 0)
          }
        }
      })
      setCourses(formatted)
      setFilteredCourses(formatted)
    } finally { setLoading(false) }
  }

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  if (loading) return <div className="p-10 text-center animate-pulse text-text-secondary">Carregando cursos...</div>

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b border-border flex justify-between items-center bg-gray-50/30 dark:bg-transparent">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-border bg-background rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Mobile: Card Layout */}
        <div className="md:hidden divide-y divide-border">
          {filteredCourses.map((course) => (
            <div key={course.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    className="w-20 h-12 object-contain rounded-md border border-border bg-gray-100 dark:bg-gray-800 shadow-sm shrink-0"
                    alt="Thumbnail"
                  />
                ) : (
                  <div className="w-20 h-12 rounded-md border border-border bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-text-secondary opacity-40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-text-primary truncate">{course.title}</div>
                  <div className="text-xs text-text-secondary">{course.teacher_name}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                    course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {course.status === 'PUBLISHED' ? 'PUBLICADO' : 'RASCUNHO'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Preço</p>
                  <p className="text-xs font-bold text-text-primary">{course.price_cents ? formatBRL(course.price_cents) : 'Grátis'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Alunos</p>
                  <p className="text-xs font-bold text-text-primary">{course.stats.totalEnrollments}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Receita</p>
                  <p className="text-xs font-bold text-text-primary">{formatBRL(course.stats.totalRevenue)}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedCourse(course); setGrantModalOpen(true); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
              >
                <Plus size={14} /> Conceder Acesso
              </button>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="sticky top-0 bg-surface shadow-sm z-10">
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Curso</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Preço</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Compradores</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Receita</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCourses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        className="w-28 h-16 object-contain rounded-md border border-border bg-gray-100 dark:bg-gray-800 shadow-sm"
                        alt="Thumbnail"
                      />
                    ) : (
                      <div className="w-28 h-16 rounded-md border border-border bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-text-secondary opacity-40" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-text-primary group-hover:text-blue-600 transition-colors">{course.title}</div>
                      <div className="text-xs text-text-secondary">{course.teacher_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                    course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {course.status === 'PUBLISHED' ? 'PUBLICADO' : 'RASCUNHO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {course.price_cents ? formatBRL(course.price_cents) : 'Gratuito'}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {course.stats.totalEnrollments}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {formatBRL(course.stats.totalRevenue)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => { setSelectedCourse(course); setGrantModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus size={14} /> Conceder Acesso
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminGrantModal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        onSuccess={fetchCoursesData}
        preSelectedCourseId={selectedCourse?.id}
        preSelectedCourseTitle={selectedCourse?.title}
      />
    </div>
  )
}