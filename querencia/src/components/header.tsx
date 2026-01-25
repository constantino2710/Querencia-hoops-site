import { useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
// Importe aqui o seu componente de Carrinho ou ícone
// import { ShoppingCart } from 'lucide-react' 

export function Header() {
  const location = useLocation()
  const { userRoles, role } = useAuth() //

  const pageTitles: Record<string, string> = {
    '/student/explore': 'Explorar Cursos',
    '/student/dashboard': 'Meu Progresso',
    '/teacher/dashboard': 'Dashboard',
    '/teacher/courses': 'Meus Cursos',
    '/admin/dashboard': 'Dashboard Admin',
    '/admin/teachers': 'Gestão de Professores',
    '/admin/students': 'Gestão de Alunos',
  }

  const currentTitle = pageTitles[location.pathname] || 'Plataforma SaaS'

  const getBorderColor = () => {
    if (userRoles.includes('ADMIN')) return 'border-red-500' //
    if (userRoles.includes('TEACHER')) return 'border-purple-500' //
    return 'border-blue-500'
  }

  return (
    <header className="bg-surface border-b border-border h-16 flex items-center justify-between px-8 shadow-sm transition-colors duration-300">
      
      <div className={`pl-3 border-l-4 ${getBorderColor()}`}>
        <h2 className="text-xl font-bold text-text-primary">{currentTitle}</h2>
      </div>

      <div className="flex items-center gap-6"> {/* Aumentei o gap para acomodar o carrinho */}
        
        {/* Lógica do Carrinho: Visível apenas para Estudantes */}
        {role === 'STUDENT' && (
          <div className="relative cursor-pointer text-text-primary hover:text-blue-500 transition-colors">
            {/* Insira aqui o seu ícone ou componente de carrinho */}
            {/* <ShoppingCart size={24} /> */}
            <span className="text-sm font-medium">Carrinho</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2 hidden sm:block">
            <span className="text-sm font-medium text-text-primary">Minha Conta</span>
            <span className="text-xs text-text-secondary">
               {userRoles[0] || 'Usuário'}
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold text-text-secondary">
            U
          </div>
        </div>
      </div>
    </header>
  )
}