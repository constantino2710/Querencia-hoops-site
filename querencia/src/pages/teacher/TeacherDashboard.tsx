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
    totalStudents: 0, 
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

      // 1. Ganhos líquidos (Busca da tabela teacher_earnings)
      const { data: earningsData } = await supabase
        .from('teacher_earnings')
        .select('net_amount_cents')
        .eq('teacher_id', user.id)

      // 2. Vendas totais (Contagem de matrículas nos cursos deste professor)
      const { count: salesCount } = await supabase
        .from('enrollments')
        .select('id, courses!inner(teacher_id)', { count: 'exact', head: true })
        .eq('courses.teacher_id', user.id)

      // 3. Contagem de cursos criados pelo professor
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)

      // 4. Total de Alunos Únicos (Filtra IDs de estudantes sem repetição)
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
  <div className="w-full max-w-none animate-in fade-in duration-500">
    <div className="w-full bg-[rgb(var(--surface))] p-6 rounded-2xl">
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
  </div>
)
}