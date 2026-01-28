/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { CartProvider } from './CartContext'

import { Layout } from './layout'
import { Login } from './pages/login'
import { Register } from './pages/register'

// --- PÁGINAS GERAIS ---
import SettingsPage from './pages/Settings'

// --- PÁGINAS DO ALUNO ---
import StudentExplore from './pages/student/StudentExplore'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCourseDetails from './pages/student/studentCourseDetails'
import StudentCoursePlayer from './pages/student/StudentCoursePlayer'

// --- PÁGINAS DO PROFESSOR ---
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherCreateCourse from './pages/teacher/TeacherCreateCourse'

// --- PÁGINAS DO ADMIN ---
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminStudents from './pages/admin/AdminStudents'

// Componente de Acesso Negado
const Unauthorized = () => {
  const { userRoles } = useAuth()
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-200">
      <h1 className="text-3xl font-bold mb-2 text-red-500">⛔ Acesso Negado</h1>
      <p>Seu perfil não tem permissão para ver esta página.</p>
      <a href="/" className="mt-6 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold transition">
        Voltar ao Início
      </a>
    </div>
  )
}

function HomeRedirect() {
  const { userRoles, loading, session } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />
  if (userRoles.includes('ADMIN')) return <Navigate to="/admin/dashboard" replace />
  if (userRoles.includes('TEACHER')) return <Navigate to="/teacher/dashboard" replace />
  if (userRoles.includes('STUDENT')) return <Navigate to="/student/explore" replace />
  return <Navigate to="/unauthorized" replace />
}

function PrivateRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { session, userRoles, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950">Carregando...</div>
  if (!session) return <Navigate to="/login" replace />
  const hasPermission = allowedRoles.some(role => userRoles.includes(role)) || userRoles.includes('ADMIN')
  if (!hasPermission) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* --- ROTAS PÚBLICAS --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* --- ROTA DE CONFIGURAÇÕES (FORA DO LAYOUT) --- */}
              <Route element={<PrivateRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} />}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* --- ROTAS COM LAYOUT (SIDEBAR + HEADER) --- */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomeRedirect />} />

                {/* ALUNO */}
                <Route element={<PrivateRoute allowedRoles={['STUDENT']} />}>
                  <Route path="/student/explore" element={<StudentExplore />} />
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/course/:id" element={<StudentCourseDetails />} />
                  <Route path="/student/course/:id/player" element={<StudentCoursePlayer />} />
                </Route>

                {/* PROFESSOR */}
                <Route element={<PrivateRoute allowedRoles={['TEACHER']} />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/teacher/courses" element={<TeacherCourses />} />            
                  <Route path="/teacher/create" element={<TeacherCreateCourse />} />
                  <Route path="/teacher/courses/:id/edit" element={<TeacherCreateCourse />} />
                </Route>

                {/* ADMIN */}
                <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/teachers" element={<AdminTeachers />} />
                  <Route path="/admin/students" element={<AdminStudents />} />
                </Route>
              </Route>

            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}