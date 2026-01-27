import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'
import { TeacherCourseCard, type CourseWithDetails } from './components/TeacherCourseCard'
import { EditCourseModal } from './components/editCourseModal'
import { SearchBar } from '../../components/searchBar' // <--- Importado

export default function TeacherCourses() {
  const { session } = useAuth()
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('') // Estado para SearchBar

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

  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      course.title.toLowerCase().includes(searchLower) ||
      (course.categories?.name && course.categories.name.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="flex flex-col h-full min-h-0 w-full">      
      {/* Controles do Topo */}
      <div className="mb-4 shrink-0 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          
          {/* USANDO O COMPONENTE NOVO */}
          <SearchBar 
            value={searchTerm} 
            onChange={setSearchTerm} 
            placeholder="Pesquisar meus cursos..."
          />

          <Link 
            to="/teacher/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <span className="text-lg leading-none mb-0.5">+</span> Novo Curso
          </Link>
        </div>
      </div>

      {/* Grid (Mantido igual) */}
      <div className="bg-surface border border-border rounded-xl shadow-sm flex-1 min-h-0 overflow-hidden flex flex-col relative">
        <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-center p-8 opacity-70">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-text-primary mb-2">Você ainda não tem cursos</h3>
              <p className="text-text-secondary max-w-sm mx-auto">
                Clique no botão "Novo Curso" acima para começar a compartilhar seu conhecimento.
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-center p-8">
              <div className="text-4xl mb-4 opacity-50">🔍</div>
              <h3 className="text-lg font-medium text-text-primary mb-1">Nenhum curso encontrado</h3>
              <p className="text-text-secondary">
                Não encontramos resultados para "{searchTerm}".
              </p>
              <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 hover:underline font-medium">
                Limpar pesquisa
              </button>
            </div>
          ) : (
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

      <EditCourseModal 
        isOpen={isEditModalOpen}
        course={selectedCourse}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateSuccess}
      />
    </div>
  )
}