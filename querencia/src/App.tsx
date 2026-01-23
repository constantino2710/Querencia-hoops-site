import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import {Layout} from './layout'
import {Login} from './pages/login'
import {Register} from './pages/register'

// Componentes (Seus Placeholders)
const StudentExplore = () => <h1 className="text-2xl">Explorar Cursos (Área do Aluno)</h1>
const StudentDash = () => <h1 className="text-2xl">Meu Progresso (Área do Aluno)</h1>
const TeacherDash = () => <h1 className="text-2xl">Vendas e Ganhos (Área do Professor)</h1>
const TeacherCourses = () => <h1 className="text-2xl">Meus Cursos (Área do Professor)</h1>
const TeacherCreate = () => <h1 className="text-2xl">Criar Curso (Área do Professor)</h1>
const AdminDash = () => <h1 className="text-2xl">Dashboard Admin</h1>
const AdminTeachers = () => <h1 className="text-2xl">Gestão de Professores</h1>
const AdminStudents = () => <h1 className="text-2xl">Gestão de Alunos</h1>

// Componente de Acesso Negado (Melhorado para Debug)
const Unauthorized = () => {
  const { userRoles } = useAuth()
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-800">
      <h1 className="text-3xl font-bold mb-2">⛔ Acesso Negado</h1>
      <p>Seu perfil não tem permissão para ver esta página.</p>
      <div className="mt-4 p-4 bg-white rounded border border-red-200 text-sm font-mono text-gray-600">
        <p>Seus Cargos: {JSON.stringify(userRoles)}</p>
        <p>Página Tentada: {window.location.pathname}</p>
      </div>
      <a href="/" className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Voltar ao Início</a>
    </div>
  )
}

// Redirecionador Inteligente
function HomeRedirect() {
  const { userRoles, loading } = useAuth()
  
  if (loading) return <div>Carregando...</div>

  // Ordem de Prioridade:
  if (userRoles.includes('ADMIN')) return <Navigate to="/admin/dashboard" replace />
  if (userRoles.includes('TEACHER')) return <Navigate to="/teacher/dashboard" replace />
  if (userRoles.includes('STUDENT')) return <Navigate to="/student/dashboard" replace />
  
  // Se não tiver cargo nenhum (Erro de conta), manda para Unauthorized
  return <Navigate to="/unauthorized" replace />
}

// Proteção de Rota
function PrivateRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { session, userRoles, loading } = useAuth()

  if (loading) return <div>Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

  // Regra: O usuário precisa ter a role exigida OU ser Admin
  const hasPermission = allowedRoles.some(role => userRoles.includes(role)) || userRoles.includes('ADMIN')
  
  if (!hasPermission) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<Layout />}>
            {/* Rota Raiz: Decide para onde jogar o usuário */}
            <Route path="/" element={<HomeRedirect />} />

            {/* --- ÁREA EXCLUSIVA DE ESTUDANTE --- */}
            {/* Note: Removi 'TEACHER' daqui. Só Aluno e Admin entram. */}
            <Route element={<PrivateRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student/explore" element={<StudentExplore />} />
              <Route path="/student/dashboard" element={<StudentDash />} />
            </Route>

            {/* --- ÁREA EXCLUSIVA DE PROFESSOR --- */}
            <Route element={<PrivateRoute allowedRoles={['TEACHER']} />}>
              <Route path="/teacher/dashboard" element={<TeacherDash />} />
              <Route path="/teacher/courses" element={<TeacherCourses />} />
              <Route path="/teacher/create" element={<TeacherCreate />} />
            </Route>

            {/* --- ÁREA EXCLUSIVA DE ADMIN --- */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDash />} />
              <Route path="/admin/teachers" element={<AdminTeachers />} />
              <Route path="/admin/students" element={<AdminStudents />} />
            </Route>

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}