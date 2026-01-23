import { useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export function Header() {
  const location = useLocation()
  const { userRoles } = useAuth()

  // DICIONÁRIO DE TÍTULOS
  // Atualizado para refletir os nomes exatos da Sidebar
  const pageTitles: Record<string, string> = {
    // Rotas de Aluno
    '/student/explore': 'Explorar Cursos',
    '/student/dashboard': 'Meu Progresso',

    // Rotas de Professor
    '/teacher/dashboard': 'Dashboard',
    '/teacher/courses': 'Meus Cursos',

    // Rotas de Admin
    '/admin/dashboard': 'Dashboard Admin',
    '/admin/teachers': 'Gestão de Professores',
    '/admin/students': 'Gestão de Alunos',
  }

  // Define o título atual ou usa um padrão
  const currentTitle = pageTitles[location.pathname] || 'Plataforma SaaS'

  // Define a cor da borda lateral baseada no cargo (mantendo cores fixas para identidade)
  const getBorderColor = () => {
    if (userRoles.includes('ADMIN')) return 'border-red-500'
    if (userRoles.includes('TEACHER')) return 'border-purple-500'
    return 'border-blue-500'
  }

  return (
    <header className="bg-surface border-b border-border h-16 flex items-center justify-between px-8 shadow-sm transition-colors duration-300">
      
      {/* Lado Esquerdo: Título da Página */}
      <div className={`pl-3 border-l-4 ${getBorderColor()}`}>
        {/* text-text-primary faz o título ficar Branco no Dark Mode e Escuro no Light Mode */}
        <h2 className="text-xl font-bold text-text-primary">{currentTitle}</h2>
      </div>

      {/* Lado Direito: Perfil do Usuário */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-2 hidden sm:block">
          <span className="text-sm font-medium text-text-primary">Minha Conta</span>
          <span className="text-xs text-text-secondary">
             {userRoles[0] || 'Usuário'}
          </span>
        </div>

        {/* Avatar Simples */}
        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold text-text-secondary">
          {/* Pode colocar a inicial do nome aqui depois */}
          U
        </div>
      </div>
    </header>
  )
}