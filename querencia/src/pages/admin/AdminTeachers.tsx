/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Search } from 'lucide-react'

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

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  if (loading) return <div className="p-10 text-center animate-pulse text-text-secondary">Carregando professores...</div>

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b border-border flex justify-between items-center bg-gray-50/30 dark:bg-transparent">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar professor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-border bg-background rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Mobile: Card Layout */}
        <div className="md:hidden divide-y divide-border">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                {teacher.avatar_url ? (
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.name || 'Professor'}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                    {getInitials(teacher.name || 'ND')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-text-primary truncate">{teacher.name || 'Nome não disponível'}</div>
                  <div className="text-xs text-text-secondary truncate">{teacher.email}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${
                  teacher.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {teacher.is_active ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Receita</p>
                  <p className="text-xs font-bold text-text-primary">{formatBRL(teacher.stats.totalRevenue)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Cursos</p>
                  <p className="text-xs font-bold text-text-primary">{teacher.stats.coursesCount}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Alunos</p>
                  <p className="text-xs font-bold text-text-primary">{teacher.stats.studentsCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="sticky top-0 bg-surface shadow-sm z-10">
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Professor</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Receita</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Cursos</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Alunos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {teacher.avatar_url ? (
                      <img
                        src={teacher.avatar_url}
                        alt={teacher.name || 'Professor'}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {getInitials(teacher.name || 'ND')}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-text-primary group-hover:text-blue-600 transition-colors">{teacher.name || 'Nome não disponível'}</div>
                      <div className="text-xs text-text-secondary">{teacher.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                    teacher.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {teacher.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {formatBRL(teacher.stats.totalRevenue)}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {teacher.stats.coursesCount}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {teacher.stats.studentsCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
