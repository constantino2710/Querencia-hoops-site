import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'
import { TeacherCourseCard, type CourseWithDetails } from './components/TeacherCourseCard'
import { EditCourseModal } from './components/editCourseModal'

export default function TeacherCourses() {
  const { session } = useAuth()
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  // Novo estado para a pesquisa
  const [searchTerm, setSearchTerm] = useState('')

  // Estados do Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null)

  useEffect(() => {
    if (session?.user.id) {
      fetchCourses()
    }
  }, [session])

  async function fetchCourses() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select(`*, course_reviews(rating), categories(name, slug)`)
        .eq('teacher_id', session!.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setCourses(data as unknown as CourseWithDetails[])
    } catch (error) {
      console.error('Erro ao buscar cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEditClick(course: CourseWithDetails) {
    setSelectedCourse(course)
    setIsEditModalOpen(true)
  }

  function handleUpdateSuccess() {
    fetchCourses()
  }

  // Lógica de Filtragem (Pesquisa)
  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      course.title.toLowerCase().includes(searchLower) ||
      (course.categories?.name && course.categories.name.toLowerCase().includes(searchLower))
    )
  })

  return (
    // Container externo ocupando a altura disponível
    <div className="flex flex-col h-[calc(100dvh-6rem)] w-full">
      
      {/* --- ÁREA DE CONTROLES (SEM TÍTULO) --- */}
      <div className="mb-4 shrink-0 px-1 w-full">
        
        {/* Container Flex que estica */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          
          {/* Barra de Pesquisa (Agora com flex-1 para ocupar o máximo de espaço) */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Pesquisar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
            />
          </div>

          {/* Botão Novo Curso (Fixo, não encolhe) */}
          <Link 
            to="/teacher/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <span className="text-lg leading-none mb-0.5">+</span> Novo Curso
          </Link>
        </div>
      </div>

      {/* --- CARD PRINCIPAL (GRID) --- */}
      <div className="bg-surface border border-border rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col relative">
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : courses.length === 0 ? (
            // Estado Vazio: Nenhum curso criado
            <div className="flex flex-col justify-center items-center h-full text-center p-8 opacity-70">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-text-primary mb-2">Você ainda não tem cursos</h3>
              <p className="text-text-secondary max-w-sm mx-auto">
                Clique no botão "Novo Curso" acima para começar a compartilhar seu conhecimento.
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            // Estado Vazio: Nenhum curso encontrado na busca
            <div className="flex flex-col justify-center items-center h-full text-center p-8">
              <div className="text-4xl mb-4 opacity-50">🔍</div>
              <h3 className="text-lg font-medium text-text-primary mb-1">Nenhum curso encontrado</h3>
              <p className="text-text-secondary">
                Não encontramos resultados para "{searchTerm}".
              </p>
              <button 
                onClick={() => setSearchTerm('')} 
                className="mt-4 text-blue-600 hover:underline font-medium"
              >
                Limpar pesquisa
              </button>
            </div>
          ) : (
            // GRID DE CURSOS
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4">
              {filteredCourses.map((course) => (
                <TeacherCourseCard 
                  key={course.id} 
                  course={course} 
                  onEdit={handleEditClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <EditCourseModal 
        isOpen={isEditModalOpen}
        course={selectedCourse}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateSuccess}
      />
    </div>
  )
}