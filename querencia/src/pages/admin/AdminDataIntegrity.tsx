/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { AlertTriangle, CheckCircle, XCircle, Database } from 'lucide-react'

interface DataIssue {
  type: 'orphan_payment' | 'orphan_enrollment' | 'invalid_student' | 'invalid_course' | 'missing_teacher_earning' | 'admin_grant_with_payment'
  severity: 'high' | 'medium' | 'low'
  description: string
  data: any
}

export default function AdminDataIntegrity() {
  const [issues, setIssues] = useState<DataIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    totalPayments: 0,
    totalEarnings: 0,
    issuesFound: 0
  })

  useEffect(() => {
    checkDataIntegrity()
  }, [])

  async function checkDataIntegrity() {
    try {
      setLoading(true)
      const foundIssues: DataIssue[] = []

      // 1. Verificar enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, student_id, course_id, status, price_paid_cents, enrolled_at, is_admin_grant')

      // 2. Verificar payments
      const { data: payments } = await supabase
        .from('payments')
        .select('id, enrollment_id, amount_cents, status, provider_payment_id')

      // 3. Verificar teacher_earnings
      const { data: earnings } = await supabase
        .from('teacher_earnings')
        .select('id, enrollment_id, teacher_id, gross_amount_cents, net_amount_cents')

      // 4. Buscar todos os users e courses válidos
      const { data: users } = await supabase.from('users').select('id')
      const { data: courses } = await supabase.from('courses').select('id, teacher_id')

      const validUserIds = new Set(users?.map(u => u.id) || [])
      const validCourseIds = new Set(courses?.map(c => c.id) || [])

      // Verificar enrollments órfãos ou inválidos
      enrollments?.forEach(enrollment => {
        // Verifica se o student_id existe
        if (!validUserIds.has(enrollment.student_id)) {
          foundIssues.push({
            type: 'invalid_student',
            severity: 'high',
            description: `Enrollment ${enrollment.id.slice(0, 8)} com student_id inválido: ${enrollment.student_id?.slice(0, 8)}`,
            data: enrollment
          })
        }

        // Verifica se o course_id existe
        if (!validCourseIds.has(enrollment.course_id)) {
          foundIssues.push({
            type: 'invalid_course',
            severity: 'high',
            description: `Enrollment ${enrollment.id.slice(0, 8)} com course_id inválido: ${enrollment.course_id?.slice(0, 8)}`,
            data: enrollment
          })
        }
      })

      // Verificar payments órfãos
      const enrollmentIds = new Set(enrollments?.map(e => e.id) || [])
      payments?.forEach(payment => {
        if (!enrollmentIds.has(payment.enrollment_id)) {
          foundIssues.push({
            type: 'orphan_payment',
            severity: 'high',
            description: `Payment ${payment.id.slice(0, 8)} sem enrollment válido (enrollment_id: ${payment.enrollment_id?.slice(0, 8)})`,
            data: payment
          })
        }
      })

      // Verificar enrollments sem payment (excluindo concessões admin)
      const paymentEnrollmentIds = new Set(payments?.map(p => p.enrollment_id) || [])
      enrollments?.forEach(enrollment => {
        if (!paymentEnrollmentIds.has(enrollment.id) && enrollment.status === 'ACTIVE' && !enrollment.is_admin_grant) {
          foundIssues.push({
            type: 'orphan_enrollment',
            severity: 'medium',
            description: `Enrollment ${enrollment.id.slice(0, 8)} ATIVO sem payment associado`,
            data: enrollment
          })
        }
      })

      // Verificar enrollments sem teacher_earnings (excluindo concessões admin)
      const earningsEnrollmentIds = new Set(earnings?.map(e => e.enrollment_id) || [])
      enrollments?.forEach(enrollment => {
        if (!earningsEnrollmentIds.has(enrollment.id) && enrollment.status === 'ACTIVE' && !enrollment.is_admin_grant) {
          foundIssues.push({
            type: 'missing_teacher_earning',
            severity: 'high',
            description: `Enrollment ${enrollment.id.slice(0, 8)} ATIVO sem teacher_earning (professor não recebeu)`,
            data: enrollment
          })
        }
      })

      // Verificar concessões admin COM payment (inconsistência)
      enrollments?.forEach(enrollment => {
        if (enrollment.is_admin_grant && paymentEnrollmentIds.has(enrollment.id)) {
          foundIssues.push({
            type: 'admin_grant_with_payment',
            severity: 'high',
            description: `Enrollment ${enrollment.id.slice(0, 8)} é concessão admin MAS tem payment associado`,
            data: enrollment
          })
        }
      })

      setIssues(foundIssues)
      setStats({
        totalEnrollments: enrollments?.length || 0,
        totalPayments: payments?.length || 0,
        totalEarnings: earnings?.length || 0,
        issuesFound: foundIssues.length
      })

    } catch (error: any) {
      console.error('Erro ao verificar integridade:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="w-5 h-5" />
      case 'medium': return <AlertTriangle className="w-5 h-5" />
      default: return <CheckCircle className="w-5 h-5" />
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
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-text-primary">Verificação de Integridade de Dados</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Identifica inconsistências em enrollments, payments e teacher_earnings criados manualmente.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border">
          <p className="text-sm text-text-secondary">Total Enrollments</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalEnrollments}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border">
          <p className="text-sm text-text-secondary">Total Payments</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalPayments}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border">
          <p className="text-sm text-text-secondary">Total Earnings</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalEarnings}</p>
        </div>
        <div className={`bg-surface p-4 rounded-xl border ${stats.issuesFound > 0 ? 'border-red-500' : 'border-green-500'}`}>
          <p className="text-sm text-text-secondary">Problemas Encontrados</p>
          <p className={`text-2xl font-bold ${stats.issuesFound > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.issuesFound}
          </p>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">
            {issues.length === 0 ? 'Nenhum Problema Encontrado ✅' : `${issues.length} Problema(s) Encontrado(s)`}
          </h3>
        </div>

        {issues.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-text-secondary">
              Todos os dados estão consistentes! Não há enrollments ou payments órfãos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {issues.map((issue, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-text-secondary">{issue.type.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <p className="text-sm text-text-primary font-medium mb-2">{issue.description}</p>
                    <details className="text-xs text-text-secondary">
                      <summary className="cursor-pointer hover:text-text-primary">Ver dados completos</summary>
                      <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                        {JSON.stringify(issue.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={checkDataIntegrity}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Verificar Novamente
        </button>
      </div>
    </div>
  )
}
