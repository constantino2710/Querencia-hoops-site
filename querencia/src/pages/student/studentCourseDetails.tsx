/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryHelper'
import { useCart } from '../../CartContext'

interface CourseDetails {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  price_cents: number | null
  updated_at: string
  created_at: string
  categories: { name: string; slug: string } | null
  teacher: { 
    id: string
    name: string
    avatar_url: string | null 
  } | null
  course_reviews: { rating: number | null }[]
  course_sections: {
    id: string
    title: string
    position: number
    lessons: { id: string; title: string; position: number }[]
  }[]
}

export default function StudentCourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, items } = useCart()
  
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (id) fetchCourseDetails()
  }, [id])

  async function fetchCourseDetails() {
    try {
      setLoading(true)
      if (!id) return

      // 1. Buscar detalhes do curso com o ID do professor
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories(name, slug),
          teacher:users!fk_courses_teacher(id, name, avatar_url),
          course_reviews(rating),
          course_sections(
            id, title, position,
            lessons(id, title, position)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        const sortedData = {
            ...data,
            course_sections: (data.course_sections || [])
                .sort((a: any, b: any) => a.position - b.position)
                .map((section: any) => ({
                    ...section,
                    lessons: (section.lessons || []).sort((a: any, b: any) => a.position - b.position)
                }))
        }
        setCourse(sortedData as unknown as CourseDetails)
        
        if (sortedData.course_sections.length > 0) {
            setExpandedSections({ [sortedData.course_sections[0].id]: true })
        }

        // 2. VERIFICAÇÃO DE MATRÍCULA CRÍTICA
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('course_id', id)
            .eq('student_id', session.user.id)
            .maybeSingle()

          if (enrollment) {
            setIsEnrolled(true)
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar detalhes:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const getRating = () => {
    if (!course?.course_reviews?.length) return 0
    const valid = course.course_reviews.filter(r => r.rating !== null)
    return valid.length ? valid.reduce((acc, curr) => acc + (curr.rating || 0), 0) / valid.length : 0
  }

  const formatPrice = (cents: number | null) => {
    if (cents === 0) return 'Grátis'
    if (!cents) return ''
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  if (!course) return <div className="p-10 text-center">Curso não encontrado</div>

  const rating = getRating()
  const totalLessons = course.course_sections?.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0) || 0
  const isInCart = items.some(item => item.id === course.id)

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 animate-in fade-in duration-500">
      <div className="py-6">
        <Link to="/student/explore" className="text-sm text-text-secondary hover:text-blue-600 flex items-center gap-1 transition-colors">
            ← Voltar para explorar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-8">
            <div>
                {course.categories && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${getCategoryColor(course.categories.slug)}`}>
                        {getCategoryIcon(course.categories.slug)}
                        {course.categories.name}
                    </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">{course.title}</h1>
                <p className="text-lg text-text-secondary mb-6 leading-relaxed">{course.description || "Sem descrição disponível."}</p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-text-primary">
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="font-bold">{rating.toFixed(1)}</span>
                        <span className="text-text-secondary">({course.course_reviews?.length || 0} avaliações)</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 py-1.5 px-3 rounded-full border border-border">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-border">
                             {course.teacher?.avatar_url ? (
                                <img src={course.teacher.avatar_url} alt={course.teacher.name} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs">
                                    {course.teacher?.name?.[0]?.toUpperCase() || 'P'}
                                </div>
                             )}
                        </div>
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider leading-none mb-0.5">Instrutor</p>
                            <span className="font-semibold text-text-primary text-sm">{course.teacher?.name || 'Professor'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                    <h2 className="text-xl font-bold text-text-primary">Conteúdo do Curso</h2>
                </div>

                <div>
                    {course.course_sections?.map((section) => (
                        <div key={section.id} className="border-b border-border last:border-0">
                            <button onClick={() => toggleSection(section.id)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <span className="font-bold">{section.title}</span>
                                <span className="text-sm opacity-60">{section.lessons?.length || 0} aulas</span>
                            </button>
                            
                            {expandedSections[section.id] && (
                                <div className="bg-background px-6 pb-4 pt-1 space-y-2">
                                    {section.lessons?.map(lesson => (
                                        <div key={lesson.id} className="flex items-center justify-between py-2 text-text-secondary pl-8 border-l-2 border-border ml-2">
                                            <span className="text-sm">{lesson.title}</span>
                                            {isEnrolled ? (
                                              <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">Assistir</span>
                                            ) : (
                                              <span className="text-xs opacity-40">🔒</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* COLUNA DIREITA - SIDEBAR DE COMPRA/ASSISTIR */}
        <div className="lg:col-span-1">
            <div className="sticky top-6 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800">
                    {course.thumbnail_url && <img src={course.thumbnail_url} className="w-full h-full object-cover" />}
                </div>

                <div className="p-6 space-y-6">
                    {/* SÓ MOSTRA PREÇO SE NÃO ESTIVER MATRICULADO */}
                    {!isEnrolled ? (
                      <>
                        <div>
                            <p className="text-3xl font-bold text-text-primary">{formatPrice(course.price_cents)}</p>
                            <p className="text-sm text-text-secondary mt-1">Acesso vitalício completo</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => addItem({
                                id: course.id,
                                title: course.title,
                                priceCents: course.price_cents,
                                thumbnailUrl: course.thumbnail_url,
                                teacherName: course.teacher?.name || null,
                                teacherId: course.teacher?.id || ''
                            })}
                            disabled={isInCart}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50"
                        >
                            {isInCart ? 'No carrinho' : 'Adicionar ao Carrinho'}
                        </button>
                      </>
                    ) : (
                      <button
                          onClick={() => navigate(`/student/course/${course.id}/player`)}
                          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
                      >
                          ▶ Assistir agora
                      </button>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}