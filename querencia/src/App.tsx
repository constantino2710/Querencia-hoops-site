import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

// ATENÇÃO: Se seus componentes usam "export default", não use chaves { }
import {Layout} from './layout'
import {Login} from './pages/login'
import {Register} from './pages/register'

// Componentes Placeholders (Substitua pelos reais quando tiver)
const StudentExplore = () => <h1 className="text-2xl p-8">Explorar Cursos (Área do Aluno) 🔍</h1>
const StudentDash = () => <h1 className="text-2xl p-8">Meu Progresso (Área do Aluno) 📊</h1>
const TeacherDash = () => <h1 className="text-2xl p-8">Vendas e Ganhos (Área do Professor) 💰</h1>
const TeacherCourses = () => <h1 className="text-2xl p-8">Meus Cursos (Área do Professor) 📚</h1>
const TeacherCreate = () => <h1 className="text-2xl p-8">Criar Curso (Área do Professor) ➕</h1>
const AdminDash = () => <h1 className="text-2xl p-8">Dashboard Admin 🛡️</h1>
const AdminTeachers = () => <h1 className="text-2xl p-8">Gestão de Professores 👨‍🏫</h1>
const AdminStudents = () => <h1 className="text-2xl p-8">Gestão de Alunos 🎓</h1>

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
      <a href="/" className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold transition">
        Voltar ao Início
      </a>
    </div>
  )
}

// Redirecionador Inteligente: Decide para onde jogar o usuário ao entrar na raiz "/"
function HomeRedirect() {
  const { userRoles, loading, session } = useAuth()
  
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

  // Ordem de Prioridade:
  if (userRoles.includes('ADMIN')) return <Navigate to="/admin/dashboard" replace />
  if (userRoles.includes('TEACHER')) return <Navigate to="/teacher/dashboard" replace />
  if (userRoles.includes('STUDENT')) return <Navigate to="/student/dashboard" replace />
  
  // Se estiver logado mas sem cargo, manda para Unauthorized ou Login
  return <Navigate to="/unauthorized" replace />
}

// Proteção de Rota
function PrivateRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { session, userRoles, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>
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
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rotas Protegidas (com Layout) */}
          <Route element={<Layout />}>
            
            {/* Rota Raiz: O HomeRedirect decide para onde você vai */}
            <Route path="/" element={<HomeRedirect />} />

            {/* --- ÁREA EXCLUSIVA DE ESTUDANTE --- */}
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