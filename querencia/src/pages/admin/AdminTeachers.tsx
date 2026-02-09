/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { TeacherStatsCard } from './components/TeacherStatsCard'

interface Teacher {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  is_active: boolean | null
}

interface TeacherWithStats extends Teacher {
  stats: {
    totalRevenue: number
    coursesCount: number
    studentsCount: number
  }
}

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<TeacherWithStats[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTeachersData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeachers(teachers)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredTeachers(
        teachers.filter(
          (t) =>
            t.name?.toLowerCase().includes(term) || t.email?.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, teachers])

  async function fetchTeachersData() {
    try {
      setLoading(true)

      // 1. Buscar todos os usuários com role TEACHER
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'TEACHER')

      const teacherIds = teacherRoles?.map((tr) => tr.user_id) || []

      if (teacherIds.length === 0) {
        setTeachers([])
        setFilteredTeachers([])
        return
      }

      // 2. Buscar dados dos professores
      const { data: teachersData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, is_active')
        .in('id', teacherIds)

      // 3. Buscar estatísticas
      // - Receita total (teacher_earnings)
      const { data: earnings } = await supabase
        .from('teacher_earnings')
        .select('teacher_id, net_amount_cents')

      // - Número de cursos
      const { data: courses } = await supabase.from('courses').select('teacher_id, id')

      // - Número de alunos únicos (enrollments ACTIVE)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, courses!inner(teacher_id)')
        .eq('status', 'ACTIVE')

      // 4. Agregar dados por professor
      const teachersWithStats: TeacherWithStats[] = (teachersData || []).map((teacher) => {
        // Receita total do professor
        const teacherEarnings = earnings?.filter((e) => e.teacher_id === teacher.id) || []
        const totalRevenue = teacherEarnings.reduce((acc, curr) => acc + curr.net_amount_cents, 0)

        // Cursos do professor
        const teacherCourses = courses?.filter((c) => c.teacher_id === teacher.id) || []
        const coursesCount = teacherCourses.length

        // Alunos únicos do professor
        const teacherEnrollments =
          enrollments?.filter((e: any) => e.courses?.teacher_id === teacher.id) || []
        const uniqueStudents = new Set(teacherEnrollments.map((e) => e.student_id))
        const studentsCount = uniqueStudents.size

        return {
          ...teacher,
          stats: {
            totalRevenue,
            coursesCount,
            studentsCount,
          },
        }
      })

      // Ordenar por receita (decrescente)
      teachersWithStats.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)

      setTeachers(teachersWithStats)
      setFilteredTeachers(teachersWithStats)
    } catch (error: any) {
      console.error('Erro ao carregar professores:', error.message)
    } finally {
      setLoading(false)
    }
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
            <h2 className="text-lg font-bold text-text-primary">Professores Cadastrados</h2>
            <p className="text-sm text-text-secondary mt-1">
              Total: {teachers.length} professor{teachers.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <input
            type="text"
            placeholder="Buscar professor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-border bg-background text-text-primary rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors max-w-xs"
          />
        </div>
      </div>

      {/* Área com scroll */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              {searchTerm ? 'Nenhum professor encontrado com esse termo.' : 'Nenhum professor cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <TeacherStatsCard key={teacher.id} teacher={teacher} stats={teacher.stats} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
