import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { getCategoryIcon, getCategoryColor } from '../../utils/categoryHelper'
import type { Database } from '../../database.types'

// Definição do Tipo com os Relacionamentos (Joins)
type CourseDetails = Database['public']['Tables']['courses']['Row'] & {
  categories: { name: string; slug: string } | null
  teacher: { name: string; avatar_url: string | null } | null
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
  
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (id) fetchCourseDetails()
  }, [id])

  async function fetchCourseDetails() {
    try {
      setLoading(true)
      
      if (!id) {
        navigate('/student/explore')
        return
      }

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories(name, slug),
          teacher:teacher_id(name, avatar_url),
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
        // Ordena as seções e aulas para garantir a ordem correta (1, 2, 3...)
        const sortedData = {
            ...data,
            course_sections: data.course_sections
                .sort((a, b) => a.position - b.position)
                .map(section => ({
                    ...section,
                    lessons: section.lessons.sort((a, b) => a.position - b.position)
                }))
        }
        setCourse(sortedData as unknown as CourseDetails)
        
        // Abre a primeira seção automaticamente para melhor UX
        if (sortedData.course_sections.length > 0) {
            setExpandedSections({ [sortedData.course_sections[0].id]: true })
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      navigate('/student/explore')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const getRating = () => {
    if (!course?.course_reviews.length) return 0
    const valid = course.course_reviews.filter(r => r.rating !== null)
    if (!valid.length) return 0
    return valid.reduce((acc, curr) => acc + (curr.rating || 0), 0) / valid.length
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  const handleAddToCart = () => {
    alert(`Curso "${course?.title}" adicionado ao carrinho!`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) return null

  const rating = getRating()
  const totalLessons = course.course_sections.reduce((acc, sec) => acc + sec.lessons.length, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      
      {/* Botão de Voltar */}
      <div className="py-6">
        <Link to="/student/explore" className="text-sm text-text-secondary hover:text-blue-600 flex items-center gap-1 transition-colors">
            ← Voltar para explorar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* === COLUNA ESQUERDA: Informações e Conteúdo === */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Cabeçalho de Informações */}
            <div>
                {/* Categoria */}
                {course.categories && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${getCategoryColor(course.categories.slug)}`}>
                        {getCategoryIcon(course.categories.slug)}
                        {course.categories.name}
                    </span>
                )}
                
                {/* Título */}
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
                    {course.title}
                </h1>
                
                {/* Descrição */}
                <p className="text-lg text-text-secondary mb-6 leading-relaxed">
                    {course.description || "Sem descrição disponível."}
                </p>

                {/* Metadados (Avaliação, Professor, Data) */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-text-primary">
                    {/* Avaliação */}
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="font-bold">{rating.toFixed(1)}</span>
                        <span className="text-text-secondary">({course.course_reviews.length} avaliações)</span>
                    </div>

                    {/* --- PROFESSOR (Foto + Nome) --- */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-border">
                             {course.teacher?.avatar_url ? (
                                <img 
                                    src={course.teacher.avatar_url} 
                                    alt={course.teacher.name} 
                                    className="w-full h-full object-cover"
                                />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold">
                                    {course.teacher?.name?.[0] || 'P'}
                                </div>
                             )}
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary leading-none mb-0.5">Criado por</p>
                            <span className="font-semibold text-blue-600">{course.teacher?.name || 'Professor'}</span>
                        </div>
                    </div>
                    {/* ------------------------------- */}

                    {/* Data */}
                    <div className="flex items-center gap-1 text-text-secondary ml-auto md:ml-0">
                        <span>📅 Atualizado em {new Date(course.updated_at || course.created_at || '').toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            {/* Accordion de Aulas */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Conteúdo do Curso</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            {course.course_sections.length} seções • {totalLessons} aulas no total
                        </p>
                    </div>
                    <button 
                        onClick={() => setExpandedSections(
                            Object.keys(expandedSections).length > 0 ? {} : 
                            Object.fromEntries(course.course_sections.map(s => [s.id, true]))
                        )}
                        className="text-sm text-blue-600 hover:underline font-medium"
                    >
                        {Object.keys(expandedSections).length > 0 ? 'Recolher tudo' : 'Expandir tudo'}
                    </button>
                </div>

                <div>
                    {course.course_sections.map((section) => (
                        <div key={section.id} className="border-b border-border last:border-0">
                            <button 
                                onClick={() => toggleSection(section.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`transform transition-transform duration-200 ${expandedSections[section.id] ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                    <span className="font-bold text-text-primary">{section.title}</span>
                                </div>
                                <span className="text-sm text-text-secondary">{section.lessons.length} aulas</span>
                            </button>
                            
                            {expandedSections[section.id] && (
                                <div className="bg-background px-6 pb-4 pt-1 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    {section.lessons.map(lesson => (
                                        <div key={lesson.id} className="flex items-center gap-3 py-2 text-text-secondary pl-8">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                                            <span className="text-sm">{lesson.title}</span>
                                            <span className="ml-auto text-xs opacity-50">🔒</span> 
                                        </div>
                                    ))}
                                    {section.lessons.length === 0 && (
                                        <p className="text-sm text-text-secondary italic pl-8">Nenhuma aula disponível ainda.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* === COLUNA DIREITA: Card de Compra === */}
        <div className="lg:col-span-1">
            <div className="sticky top-6 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 relative">
                    {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-secondary">Sem imagem</div>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-3xl font-bold text-text-primary">
                            {formatPrice(course.price_cents)}
                        </p>
                        {course.price_cents !== null && course.price_cents > 0 && (
                            <p className="text-sm text-text-secondary mt-1">Acesso vitalício completo</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleAddToCart}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <span>🛒</span> Adicionar ao Carrinho
                        </button>
                        <button className="w-full py-3 bg-surface border border-border hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary font-bold rounded-lg transition-colors">
                            Comprar Agora
                        </button>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border text-sm text-text-secondary">
                        <p className="flex items-center gap-2"><span>✅</span> Garantia de 7 dias</p>
                        <p className="flex items-center gap-2"><span>📱</span> Acesso no celular e PC</p>
                        <p className="flex items-center gap-2"><span>🏆</span> Certificado de conclusão</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}