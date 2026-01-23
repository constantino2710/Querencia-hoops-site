import { Link } from 'react-router-dom'

export default function TeacherCourses() {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">Gerenciar Cursos</h2>
        
        {/* Botão com cor fixa (azul) que se destaca em ambos os temas */}
        <Link 
          to="/teacher/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          + Novo Curso
        </Link>
      </div>

      <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
        <p className="text-text-secondary mb-2">Você ainda não criou nenhum curso.</p>
        <p className="text-sm text-text-secondary opacity-70">Clique no botão acima para começar.</p>
      </div>
    </div>
  )
}