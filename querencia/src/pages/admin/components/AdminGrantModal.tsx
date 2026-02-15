/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../../supabaseClient'
import { X, Search, Gift, AlertCircle } from 'lucide-react'

interface AdminGrantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preSelectedStudentId?: string
  preSelectedStudentName?: string
  preSelectedCourseId?: string
  preSelectedCourseTitle?: string
}

interface StudentOption {
  id: string
  name: string | null
  email: string
}

interface CourseOption {
  id: string
  title: string
  teacher_name: string | null
}

export function AdminGrantModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedStudentId,
  preSelectedStudentName,
  preSelectedCourseId,
  preSelectedCourseTitle,
}: AdminGrantModalProps) {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedStudentLabel, setSelectedStudentLabel] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedCourseLabel, setSelectedCourseLabel] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    resetState()

    if (preSelectedStudentId) {
      setSelectedStudentId(preSelectedStudentId)
      setSelectedStudentLabel(preSelectedStudentName || preSelectedStudentId)
    }
    if (preSelectedCourseId) {
      setSelectedCourseId(preSelectedCourseId)
      setSelectedCourseLabel(preSelectedCourseTitle || preSelectedCourseId)
    }
  }, [isOpen, preSelectedStudentId, preSelectedStudentName, preSelectedCourseId, preSelectedCourseTitle])

  useEffect(() => {
    if (!isOpen) return
    if (!preSelectedStudentId) fetchStudents('')
    if (!preSelectedCourseId) fetchCourses('')
  }, [isOpen, preSelectedStudentId, preSelectedCourseId])

  useEffect(() => {
    if (!isOpen || preSelectedStudentId) return
    const timeout = setTimeout(() => fetchStudents(studentSearch.trim()), 300)
    return () => clearTimeout(timeout)
  }, [studentSearch, isOpen, preSelectedStudentId])

  useEffect(() => {
    if (!isOpen || preSelectedCourseId) return
    const timeout = setTimeout(() => fetchCourses(courseSearch.trim()), 300)
    return () => clearTimeout(timeout)
  }, [courseSearch, isOpen, preSelectedCourseId])

  function resetState() {
    setSelectedStudentId(null)
    setSelectedStudentLabel('')
    setSelectedCourseId(null)
    setSelectedCourseLabel('')
    setStudentSearch('')
    setCourseSearch('')
    setShowConfirm(false)
    setError(null)
    setStudents([])
    setCourses([])
    setShowStudentDropdown(false)
    setShowCourseDropdown(false)
  }

  async function fetchStudents(term: string) {
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id, roles!inner(name)')
      .eq('roles.name', 'STUDENT')

    const studentIds = studentRoles?.map((sr) => sr.user_id) || []
    if (studentIds.length === 0) return

    // Buscar alunos que já têm matrícula ativa no curso selecionado
    let enrolledStudentIds: string[] = []
    const courseId = preSelectedCourseId || selectedCourseId
    if (courseId) {
      const { data: activeEnrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .eq('status', 'ACTIVE')
      enrolledStudentIds = activeEnrollments?.map((e) => e.student_id) || []
    }

    // Filtrar alunos já matriculados
    const availableIds = studentIds.filter((id) => !enrolledStudentIds.includes(id))
    if (availableIds.length === 0) {
      setStudents([])
      return
    }

    let query = supabase
      .from('users')
      .select('id, name, email')
      .in('id', availableIds)
      .limit(50)

    if (term) {
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)
    }

    const { data } = await query
    setStudents(data || [])
  }

  async function fetchCourses(term: string) {
    // Buscar cursos que o aluno já tem matrícula ativa
    let enrolledCourseIds: string[] = []
    const studentId = preSelectedStudentId || selectedStudentId
    if (studentId) {
      const { data: activeEnrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'ACTIVE')
      enrolledCourseIds = activeEnrollments?.map((e) => e.course_id) || []
    }

    let query = supabase
      .from('courses')
      .select('id, title, teacher_id')
      .eq('status', 'PUBLISHED')
      .limit(50)

    if (term) {
      query = query.ilike('title', `%${term}%`)
    }

    const { data } = await query
    if (!data) return

    // Filtrar cursos já matriculados
    const availableCourses = data.filter((c) => !enrolledCourseIds.includes(c.id))

    const teacherIds = [...new Set(availableCourses.map((c) => c.teacher_id))]
    if (teacherIds.length === 0) {
      setCourses([])
      return
    }

    const { data: teachers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', teacherIds)

    const teacherMap = new Map(teachers?.map((t) => [t.id, t.name]) || [])

    setCourses(
      availableCourses.map((c) => ({
        id: c.id,
        title: c.title,
        teacher_name: teacherMap.get(c.teacher_id) || null,
      }))
    )
  }

  async function handleGrant() {
    if (!selectedStudentId || !selectedCourseId) return

    setLoading(true)
    setError(null)

    try {
      // Verifica se já existe matrícula
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('student_id', selectedStudentId)
        .eq('course_id', selectedCourseId)
        .maybeSingle()

      if (existing && existing.status === 'ACTIVE') {
        setError('Este aluno já possui matrícula ativa neste curso.')
        setLoading(false)
        return
      }

      if (existing) {
        // Reativar matrícula cancelada/reembolsada
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({
            status: 'ACTIVE',
            price_paid_cents: 0,
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        // Criar nova matrícula
        const { error: insertError } = await supabase.from('enrollments').insert({
          student_id: selectedStudentId,
          course_id: selectedCourseId,
          status: 'ACTIVE',
          price_paid_cents: 0,
          currency: 'BRL',
        })

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao conceder acesso.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Conceder Acesso</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {/* Seleção de Aluno */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Aluno</label>
            {preSelectedStudentId ? (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-text-primary border border-border">
                {selectedStudentLabel}
              </div>
            ) : selectedStudentId ? (
              <div className="flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <span className="text-sm text-text-primary font-medium">{selectedStudentLabel}</span>
                <button
                  onClick={() => {
                    setSelectedStudentId(null)
                    setSelectedStudentLabel('')
                    setStudentSearch('')
                  }}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value)
                      setShowStudentDropdown(true)
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 border border-border bg-background text-text-primary rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                {showStudentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {students.length > 0 ? students.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentId(s.id)
                          setSelectedStudentLabel(s.name ? `${s.name} (${s.email})` : s.email)
                          setShowStudentDropdown(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-border last:border-b-0"
                      >
                        <p className="text-sm font-medium text-text-primary">{s.name || 'Sem nome'}</p>
                        <p className="text-xs text-text-secondary">{s.email}</p>
                      </button>
                    )) : (
                      <p className="px-4 py-3 text-sm text-text-secondary">Nenhum aluno encontrado</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seleção de Curso */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Curso</label>
            {preSelectedCourseId ? (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-text-primary border border-border">
                {selectedCourseLabel}
              </div>
            ) : selectedCourseId ? (
              <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm text-text-primary font-medium">{selectedCourseLabel}</span>
                <button
                  onClick={() => {
                    setSelectedCourseId(null)
                    setSelectedCourseLabel('')
                    setCourseSearch('')
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do curso..."
                    value={courseSearch}
                    onChange={(e) => {
                      setCourseSearch(e.target.value)
                      setShowCourseDropdown(true)
                    }}
                    onFocus={() => setShowCourseDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 border border-border bg-background text-text-primary rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                {showCourseDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {courses.length > 0 ? courses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCourseId(c.id)
                          setSelectedCourseLabel(c.title)
                          setShowCourseDropdown(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-border last:border-b-0"
                      >
                        <p className="text-sm font-medium text-text-primary">{c.title}</p>
                        {c.teacher_name && (
                          <p className="text-xs text-text-secondary">Prof. {c.teacher_name}</p>
                        )}
                      </button>
                    )) : (
                      <p className="px-4 py-3 text-sm text-text-secondary">Nenhum curso encontrado</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Confirmação */}
          {showConfirm && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">Confirmar Concessão</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                O aluno <strong>{selectedStudentLabel}</strong> receberá acesso gratuito ao curso{' '}
                <strong>{selectedCourseLabel}</strong>. Nenhum pagamento ou receita será gerado.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          {!showConfirm ? (
            <button
              onClick={() => {
                setError(null)
                setShowConfirm(true)
              }}
              disabled={!selectedStudentId || !selectedCourseId}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Conceder Acesso
            </button>
          ) : (
            <button
              onClick={handleGrant}
              disabled={loading}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Concedendo...' : 'Confirmar Concessão'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
