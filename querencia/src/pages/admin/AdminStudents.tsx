/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { AdminGrantModal } from './components/AdminGrantModal'
import { Search, Plus } from 'lucide-react'

interface Student {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  is_active: boolean | null
}

interface StudentWithStats extends Student {
  stats: {
    enrollmentsCount: number
    totalSpent: number
  }
}

export default function AdminStudents() {
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>()
  const [selectedStudentName, setSelectedStudentName] = useState<string | undefined>()

  useEffect(() => {
    fetchStudentsData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, students])

  async function fetchStudentsData() {
    try {
      setLoading(true)

      // 1. Buscar todos os usuários com role STUDENT
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'STUDENT')

      const studentIds = studentRoles?.map((sr) => sr.user_id) || []

      if (studentIds.length === 0) {
        setStudents([])
        setFilteredStudents([])
        return
      }

      // 2. Buscar dados dos estudantes
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, is_active')
        .in('id', studentIds)

      // 3. Buscar estatísticas
      // - Número de cursos matriculados (enrollments ACTIVE)
      // - Total gasto (sum de price_paid_cents de enrollments ACTIVE)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, price_paid_cents')
        .eq('status', 'ACTIVE')

      // 4. Agregar dados por estudante
      const studentsWithStats: StudentWithStats[] = (studentsData || []).map((student) => {
        const studentEnrollments = enrollments?.filter((e) => e.student_id === student.id) || []
        const enrollmentsCount = studentEnrollments.length
        const totalSpent = studentEnrollments.reduce((acc, curr) => acc + (curr.price_paid_cents || 0), 0)

        return {
          ...student,
          stats: {
            enrollmentsCount,
            totalSpent,
          },
        }
      })

      // Ordenar por total gasto (decrescente)
      studentsWithStats.sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)

      setStudents(studentsWithStats)
      setFilteredStudents(studentsWithStats)
    } catch (error: any) {
      console.error('Erro ao carregar estudantes:', error.message)
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

  if (loading) return <div className="p-10 text-center animate-pulse text-text-secondary">Carregando estudantes...</div>

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b border-border flex justify-between items-center bg-gray-50/30 dark:bg-transparent">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar estudante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-border bg-background rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Mobile: Card Layout */}
        <div className="md:hidden divide-y divide-border">
          {filteredStudents.map((student) => (
            <div key={student.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                {student.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.name || 'Estudante'}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                    {getInitials(student.name || 'ND')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-text-primary truncate">{student.name || 'Nome não disponível'}</div>
                  <div className="text-xs text-text-secondary truncate">{student.email}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${
                  student.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {student.is_active ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Cursos</p>
                  <p className="text-xs font-bold text-text-primary">{student.stats.enrollmentsCount}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-2">
                  <p className="text-[10px] text-text-secondary uppercase">Total Gasto</p>
                  <p className="text-xs font-bold text-text-primary">{formatBRL(student.stats.totalSpent)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudentId(student.id)
                  setSelectedStudentName(student.name || student.email)
                  setGrantModalOpen(true)
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
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
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Estudante</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Cursos</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-center">Total Gasto</th>
              <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.name || 'Estudante'}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-sm">
                        {getInitials(student.name || 'ND')}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-text-primary group-hover:text-blue-600 transition-colors">{student.name || 'Nome não disponível'}</div>
                      <div className="text-xs text-text-secondary">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                    student.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {student.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {student.stats.enrollmentsCount}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-text-secondary">
                  {formatBRL(student.stats.totalSpent)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedStudentId(student.id)
                      setSelectedStudentName(student.name || student.email)
                      setGrantModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm hover:shadow-md"
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
        onClose={() => {
          setGrantModalOpen(false)
          setSelectedStudentId(undefined)
          setSelectedStudentName(undefined)
        }}
        onSuccess={fetchStudentsData}
        preSelectedStudentId={selectedStudentId}
        preSelectedStudentName={selectedStudentName}
      />
    </div>
  )
}
