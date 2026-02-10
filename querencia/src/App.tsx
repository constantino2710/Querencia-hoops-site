import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ThemeProvider } from './ThemeContext' // <--- IMPORTANTE: Adicionado
import { CartProvider } from './CartContext'

import { Layout } from './layout'
import { Login } from './pages/login'
import { Register } from './pages/register'

// --- PÁGINAS DO ALUNO ---
import StudentExplore from './pages/student/StudentExplore'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCourseDetails from './pages/student/studentCourseDetails'

// --- PÁGINAS DO PROFESSOR ---
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherCreateCourse from './pages/teacher/TeacherCreateCourse'

// --- PÁGINAS DO ADMIN ---
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminStudents from './pages/admin/AdminStudents'
import AdminSettings from './pages/admin/AdminSettings'

// --- PÁGINA DE PERFIL (COMUM) ---
import ProfileSettings from './pages/ProfileSetings'
import StudentCoursePlayer from './pages/student/StudentCoursePlayer'

// Componente de Acesso Negado
const Unauthorized = () => {
  const { userRoles } = useAuth()
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-800">
      <h1 className="text-3xl font-bold mb-2">Acesso Negado</h1>
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

// Redirecionador Inteligente (Rota /)
function HomeRedirect() {
  const { userRoles, loading, session } = useAuth()
  
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

  // Prioridade de Redirecionamento
  if (userRoles.includes('ADMIN')) return <Navigate to="/admin/dashboard" replace />
  if (userRoles.includes('TEACHER')) return <Navigate to="/teacher/dashboard" replace />
  if (userRoles.includes('STUDENT')) return <Navigate to="/student/explore" replace /> // Ajustado para Explore
  
  return <Navigate to="/unauthorized" replace />
}

// Proteção de Rota por Role
function PrivateRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { session, userRoles, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />

  // Verifica se o usuário tem ALGUMA das roles permitidas
  const hasPermission = allowedRoles.some(role => userRoles.includes(role)) || userRoles.includes('ADMIN')
  
  if (!hasPermission) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider> {/* Provedor de Tema envolvendo a aplicação */}
        <AuthProvider>
          <CartProvider>
            <Routes>
              
              {/* --- ROTAS PÚBLICAS --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* --- ROTAS PROTEGIDAS (COM SIDEBAR/LAYOUT) --- */}
              <Route element={<Layout />}>
                
                {/* Rota Raiz */}
                <Route path="/" element={<HomeRedirect />} />

                {/* ROTA COMUM: PERFIL (Acessível para todos os logados) */}
                <Route element={<PrivateRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} />}>
                  <Route path="/profile" element={<ProfileSettings />} />
                </Route>

                {/* --- ALUNO --- */}
                <Route element={<PrivateRoute allowedRoles={['STUDENT']} />}>
                  <Route path="/student/explore" element={<StudentExplore />} />
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/course/:id" element={<StudentCourseDetails />} />
                  <Route path="/student/course/:id/player" element={<StudentCoursePlayer />} />
                </Route>

                {/* --- PROFESSOR --- */}
                <Route element={<PrivateRoute allowedRoles={['TEACHER']} />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/teacher/courses" element={<TeacherCourses />} />            
                  <Route path="/teacher/create" element={<TeacherCreateCourse />} />
                  {/* Rota de Edição (Importante para o botão Gerenciar) */}
                  <Route path="/teacher/courses/:id/edit" element={<TeacherCreateCourse />} />
                </Route>

                {/* --- ADMIN --- */}
                <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/teachers" element={<AdminTeachers />} />
                  <Route path="/admin/students" element={<AdminStudents />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>

              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}