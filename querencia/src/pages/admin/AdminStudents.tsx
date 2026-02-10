/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { StudentStatsCard } from './components/StudentStatsCard'
import { AdminGrantModal } from './components/AdminGrantModal'

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
    adminGrantsCount: number
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
        .select('student_id, price_paid_cents, is_admin_grant')
        .eq('status', 'ACTIVE')

      // 4. Agregar dados por estudante
      const studentsWithStats: StudentWithStats[] = (studentsData || []).map((student) => {
        // Enrollments do estudante
        const studentEnrollments = enrollments?.filter((e) => e.student_id === student.id) || []
        const enrollmentsCount = studentEnrollments.length
        const adminGrantsCount = studentEnrollments.filter((e) => e.is_admin_grant).length

        // Total gasto (apenas matrículas pagas)
        const totalSpent = studentEnrollments
          .filter((e) => !e.is_admin_grant)
          .reduce((acc, curr) => acc + (curr.price_paid_cents || 0), 0)

        return {
          ...student,
          stats: {
            enrollmentsCount,
            adminGrantsCount,
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
            <h2 className="text-lg font-bold text-text-primary">Estudantes Cadastrados</h2>
            <p className="text-sm text-text-secondary mt-1">
              Total: {students.length} estudante{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          <input
            type="text"
            placeholder="Buscar estudante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-border bg-background text-text-primary rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors max-w-xs"
          />
        </div>
      </div>

      {/* Área com scroll */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              {searchTerm ? 'Nenhum estudante encontrado com esse termo.' : 'Nenhum estudante cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentStatsCard
                key={student.id}
                student={student}
                stats={student.stats}
                onGrantAccess={(studentId, studentName) => {
                  setSelectedStudentId(studentId)
                  setSelectedStudentName(studentName)
                  setGrantModalOpen(true)
                }}
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
