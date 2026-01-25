/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { StatCard } from './components/StatCard'
import { DollarSign, Users, BookOpen, TrendingUp, GraduationCap } from 'lucide-react'

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalNetEarnings: 0,
    totalSalesCount: 0,
    coursesCount: 0,
    totalStudents: 0, // Novo estado para total de alunos
    avgRating: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ganhos reais da tabela teacher_earnings
      const { data: earningsData } = await supabase
        .from('teacher_earnings')
        .select('net_amount_cents')
        .eq('teacher_id', user.id)

      // 2. Vendas totais (enrollments) filtrando pelos cursos do professor
      const { count: salesCount } = await supabase
        .from('enrollments')
        .select('id, courses!inner(teacher_id)', { count: 'exact', head: true })
        .eq('courses.teacher_id', user.id)

      // 3. Contagem de cursos criados
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)

      // 4. Total de Alunos Únicos (Estudantes distintos matriculados nos cursos dele)
      // Buscamos os student_id únicos das matrículas vinculadas aos cursos do professor
      const { data: studentsData } = await supabase
        .from('enrollments')
        .select('student_id, courses!inner(teacher_id)')
        .eq('courses.teacher_id', user.id)

      const uniqueStudents = studentsData ? new Set(studentsData.map(s => s.student_id)).size : 0

      const totalNetCents = earningsData?.reduce((acc, curr) => acc + curr.net_amount_cents, 0) || 0

      setStats({
        totalNetEarnings: totalNetCents / 100,
        totalSalesCount: salesCount || 0,
        coursesCount: coursesCount || 0,
        totalStudents: uniqueStudents,
        avgRating: 4.8 
      })

    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel do Professor</h1>
        <p className="text-gray-500 dark:text-gray-400">Dados reais de vendas e alunos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Saldo Líquido" 
          value={formatBRL(stats.totalNetEarnings)}
          icon={<DollarSign className="w-6 h-6" />}
          variant="green"
          description="Total após taxas (5%)"
        />
        <StatCard 
          title="Vendas Totais" 
          value={stats.totalSalesCount}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="blue"
          description="Matrículas realizadas"
        />
        <StatCard 
          title="Total de Alunos" 
          value={stats.totalStudents}
          icon={<GraduationCap className="w-6 h-6" />}
          variant="purple"
          description="Estudantes únicos"
        />
        <StatCard 
          title="Meus Cursos" 
          value={stats.coursesCount}
          icon={<BookOpen className="w-6 h-6" />}
          variant="yellow"
        />
      </div>
    </div>
  )
}