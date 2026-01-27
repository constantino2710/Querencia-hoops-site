/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getStoredCourseProgress } from './utils/courseProgress'
import { CourseProgressCard } from './components/CourseProgressCard'
import { supabase } from '../../supabaseClient'
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryHelper'
import { useCart } from '../../CartContext'
import { Play } from 'lucide-react'

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
  const [userId, setUserId] = useState<string>('')

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
          setUserId(session.user.id)
          const { data: enrollment } = await supabase
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

  const progress = course && userId
    ? getStoredCourseProgress(
        userId,
        course.id,
        course.course_sections.flatMap((section) => section.lessons.map((lesson) => lesson.id))
      )
    : null

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  if (!course) return <div className="p-10 text-center">Curso não encontrado</div>

  const rating = getRating()
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
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                        {course.teacher?.avatar_url ? (
                            <img src={course.teacher.avatar_url} className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {course.teacher?.name.charAt(0)}
                            </div>
                        )}
                        <span className="font-medium">Prof. {course.teacher?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-500 font-bold">★ {rating.toFixed(1)}</span>
                        <span>({course.course_reviews.length} avaliações)</span>
                    </div>
                    <div>Atualizado em {new Date(course.updated_at).toLocaleDateString('pt-BR')}</div>
                </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-bold mb-4">Sobre este curso</h2>
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{course.description}</p>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-6">Conteúdo do curso</h2>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-surface">
                    {course.course_sections.map(section => (
                        <div key={section.id} className="group">
                            <button 
                                onClick={() => toggleSection(section.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-background transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold opacity-30">{String(section.position).padStart(2, '0')}</span>
                                    <span className="font-bold text-text-primary">{section.title}</span>
                                </div>
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
          <div className="sticky top-6 space-y-6">
              {isEnrolled && progress ? <CourseProgressCard progress={progress} /> : null}
              <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800">
                    {course.thumbnail_url && <img src={course.thumbnail_url} className="w-full h-full object-cover" />}
                </div>

                <div className="p-6 space-y-6">
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
                        <Play className="w-5 h-5" /> {/* ✅ troca o "▶" por isso */}
                        Assistir agora
                      </button>
                    )}
                </div>
              </div>
          </div>
        </div>

      </div>
    </div>
  )
}