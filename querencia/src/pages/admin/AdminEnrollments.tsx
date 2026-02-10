/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { AdminGrantModal } from './components/AdminGrantModal'
import { ConfirmRevokeModal } from './components/ConfirmRevokeModal'
import { Gift, DollarSign, Search, Plus, XCircle } from 'lucide-react'

interface EnrollmentRow {
  id: string
  student_id: string
  course_id: string
  status: string | null
  price_paid_cents: number
  is_admin_grant: boolean
  admin_notes: string | null
  enrolled_at: string | null
  granted_at: string | null
  student_name: string | null
  student_email: string
  course_title: string
}

type FilterTab = 'all' | 'paid' | 'admin_grant'

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [revokeEnrollment, setRevokeEnrollment] = useState<{
    id: string
    studentName: string
    courseTitle: string
  } | null>(null)

  useEffect(() => {
    fetchEnrollments()
  }, [])

  useEffect(() => {
    let result = enrollments

    // Filtro por tipo
    if (filter === 'paid') {
      result = result.filter((e) => !e.is_admin_grant)
    } else if (filter === 'admin_grant') {
      result = result.filter((e) => e.is_admin_grant)
    }

    // Busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (e) =>
          e.student_name?.toLowerCase().includes(term) ||
          e.student_email?.toLowerCase().includes(term) ||
          e.course_title?.toLowerCase().includes(term)
      )
    }

    setFilteredEnrollments(result)
  }, [searchTerm, filter, enrollments])

  async function fetchEnrollments() {
    try {
      setLoading(true)

      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('id, student_id, course_id, status, price_paid_cents, is_admin_grant, admin_notes, enrolled_at, granted_at')
        .order('enrolled_at', { ascending: false })

      if (!enrollmentsData || enrollmentsData.length === 0) {
        setEnrollments([])
        setFilteredEnrollments([])
        return
      }

      // Buscar dados de alunos
      const studentIds = [...new Set(enrollmentsData.map((e) => e.student_id))]
      const { data: students } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', studentIds)

      const studentMap = new Map(students?.map((s) => [s.id, { name: s.name, email: s.email }]) || [])

      // Buscar dados de cursos
      const courseIds = [...new Set(enrollmentsData.map((e) => e.course_id))]
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds)

      const courseMap = new Map(courses?.map((c) => [c.id, c.title]) || [])

      const rows: EnrollmentRow[] = enrollmentsData.map((e) => {
        const student = studentMap.get(e.student_id)
        return {
          ...e,
          student_name: student?.name || null,
          student_email: student?.email || '',
          course_title: courseMap.get(e.course_id) || 'Curso não encontrado',
        }
      })

      setEnrollments(rows)
      setFilteredEnrollments(rows)
    } catch (error: any) {
      console.error('Erro ao carregar matrículas:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatBRL = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: enrollments.length },
    { key: 'paid', label: 'Pagas', count: enrollments.filter((e) => !e.is_admin_grant).length },
    { key: 'admin_grant', label: 'Concessões', count: enrollments.filter((e) => e.is_admin_grant).length },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border transition-colors duration-300 h-[calc(100vh-200px)] flex flex-col">
      {/* Cabeçalho */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Gestão de Matrículas</h2>
            <p className="text-sm text-text-secondary mt-1">
              Total: {enrollments.length} matrícula{enrollments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar aluno ou curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border bg-background text-text-primary rounded-lg text-sm outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
            <button
              onClick={() => setGrantModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Concessão
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              {searchTerm || filter !== 'all'
                ? 'Nenhuma matrícula encontrada com esses filtros.'
                : 'Nenhuma matrícula cadastrada ainda.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-surface border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Aluno</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Curso</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Tipo</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Valor</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Data</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-secondary uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-text-primary">{enrollment.student_name || 'Sem nome'}</p>
                    <p className="text-xs text-text-secondary">{enrollment.student_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-text-primary max-w-[200px] truncate">{enrollment.course_title}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {enrollment.is_admin_grant ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Gift className="w-3 h-3" />
                        Concessão
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <DollarSign className="w-3 h-3" />
                        Pago
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-text-primary">
                      {enrollment.is_admin_grant ? 'Gratuito' : formatBRL(enrollment.price_paid_cents)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-text-secondary">
                      {formatDate(enrollment.is_admin_grant ? enrollment.granted_at : enrollment.enrolled_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        enrollment.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : enrollment.status === 'CANCELED'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}
                    >
                      {enrollment.status === 'ACTIVE' ? 'Ativo' : enrollment.status === 'CANCELED' ? 'Cancelado' : enrollment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {enrollment.is_admin_grant && enrollment.status === 'ACTIVE' && (
                      <button
                        onClick={() =>
                          setRevokeEnrollment({
                            id: enrollment.id,
                            studentName: enrollment.student_name || enrollment.student_email,
                            courseTitle: enrollment.course_title,
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Revogar
                      </button>
                    )}
                    {enrollment.is_admin_grant && enrollment.admin_notes && (
                      <p className="text-xs text-text-secondary mt-1 italic" title={enrollment.admin_notes}>
                        {enrollment.admin_notes.length > 30
                          ? enrollment.admin_notes.slice(0, 30) + '...'
                          : enrollment.admin_notes}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modais */}
      <AdminGrantModal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        onSuccess={fetchEnrollments}
      />

      <ConfirmRevokeModal
        isOpen={!!revokeEnrollment}
        onClose={() => setRevokeEnrollment(null)}
        onSuccess={fetchEnrollments}
        enrollment={revokeEnrollment}
      />
    </div>
  )
}
