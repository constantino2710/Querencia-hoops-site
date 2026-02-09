/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { StatCard } from './components/StatCard'
import { DollarSign, TrendingUp, UserCog, GraduationCap, BookOpen } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalTeachers: 0,
    totalStudents: 0,
    publishedCourses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // 1. Total de receitas da plataforma (soma de todos teacher_earnings)
      const { data: allEarnings } = await supabase
        .from('teacher_earnings')
        .select('net_amount_cents')

      const totalPlatformRevenue = allEarnings
        ?.reduce((acc, curr) => acc + curr.net_amount_cents, 0) || 0

      // 2. Total de professores (users com role TEACHER)
      const { data: teachers } = await supabase
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'TEACHER')

      const teachersCount = new Set(teachers?.map(t => t.user_id)).size

      // 3. Total de estudantes (users com role STUDENT)
      const { data: students } = await supabase
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'STUDENT')

      const studentsCount = new Set(students?.map(s => s.user_id)).size

      // 4. Total de cursos publicados
      const { count: publishedCoursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PUBLISHED')

      // 5. Total de vendas ativas (enrollments ACTIVE)
      const { count: activeSalesCount } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

      setStats({
        totalRevenue: totalPlatformRevenue / 100,
        totalSales: activeSalesCount || 0,
        totalTeachers: teachersCount,
        totalStudents: studentsCount,
        publishedCourses: publishedCoursesCount || 0
      })

    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-[rgb(var(--surface))] p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="text-xl font-bold text-text-primary mb-6">Visão Geral da Plataforma</h2>

        <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Receita Total"
            value={formatBRL(stats.totalRevenue)}
            icon={<DollarSign className="w-6 h-6" />}
            variant="green"
            description="Total após taxas (5%)"
          />
          <StatCard
            title="Vendas Totais"
            value={stats.totalSales}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="blue"
            description="Matrículas ativas"
          />
          <StatCard
            title="Professores"
            value={stats.totalTeachers}
            icon={<UserCog className="w-6 h-6" />}
            variant="purple"
            description="Total cadastrados"
          />
          <StatCard
            title="Estudantes"
            value={stats.totalStudents}
            icon={<GraduationCap className="w-6 h-6" />}
            variant="yellow"
            description="Total cadastrados"
          />
          <StatCard
            title="Cursos Publicados"
            value={stats.publishedCourses}
            icon={<BookOpen className="w-6 h-6" />}
            variant="blue"
            description="Disponíveis na plataforma"
          />
        </div>
      </div>
    </div>
  )
}
