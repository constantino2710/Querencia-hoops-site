import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

import {Layout} from './layout'
import {Login} from './pages/login'
import {Register} from './pages/register'

// --- IMPORTAÇÕES DAS NOVAS PÁGINAS ---
// Aluno
import StudentExplore from './pages/student/StudentExplore'
import StudentDashboard from './pages/student/StudentDashboard'

// Professor
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherCreateCourse from './pages/teacher/TeacherCreateCourse'
// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminStudents from './pages/admin/AdminStudents'

// Componente de Acesso Negado
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

// Redirecionador Inteligente
function HomeRedirect() {
  const { userRoles, loading, session } = useAuth()
  
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

  // Ordem de Prioridade:
  if (userRoles.includes('ADMIN')) return <Navigate to="/admin/dashboard" replace />
  if (userRoles.includes('TEACHER')) return <Navigate to="/teacher/dashboard" replace />
  if (userRoles.includes('STUDENT')) return <Navigate to="/student/dashboard" replace />
  
  return <Navigate to="/unauthorized" replace />
}

// Proteção de Rota
function PrivateRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { session, userRoles, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

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

          {/* Rotas Protegidas (Layout com Sidebar) */}
          <Route element={<Layout />}>
            
            {/* Rota Raiz: Redireciona para o dashboard correto */}
            <Route path="/" element={<HomeRedirect />} />

            {/* --- ROTAS DO ALUNO --- */}
            <Route element={<PrivateRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student/explore" element={<StudentExplore />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
            </Route>

            {/* --- ROTAS DO PROFESSOR --- */}
            <Route element={<PrivateRoute allowedRoles={['TEACHER']} />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/courses" element={<TeacherCourses />} />            
              <Route path="/teacher/Create" element={<TeacherCreateCourse />} />
              </Route>

            {/* --- ROTAS DO ADMIN --- */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/teachers" element={<AdminTeachers />} />
              <Route path="/admin/students" element={<AdminStudents />} />
            </Route>

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}