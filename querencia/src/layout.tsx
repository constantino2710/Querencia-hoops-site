import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Bell } from 'lucide-react' // Ícone de notificação (opcional)

export function Layout() {
  const location = useLocation()

  // Função para definir o título do Header baseado na rota atual
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/student/explore')) return 'Explorar Cursos'
    if (path.includes('/student/dashboard')) return 'Meu Aprendizado'
    if (path.includes('/student/courses')) return 'Detalhes do Curso'
    
    if (path.includes('/teacher/create')) return 'Criar Novo Curso'
    if (path.includes('/teacher/courses')) return 'Meus Cursos'
    if (path.includes('/teacher/dashboard')) return 'Painel do Professor'
    
    if (path.includes('/admin')) return 'Administração'
    if (path.includes('/profile')) return 'Meu Perfil'
    
    return 'Hoops Hub' // Título padrão
  }

  return (
    <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
      
      {/* 1. SIDEBAR (Fixa na esquerda) */}
      <Sidebar />

      {/* 2. CONTEÚDO PRINCIPAL (Direita) */}
      {/* ml-64: Empurra o conteúdo para não ficar embaixo da sidebar */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen w-[calc(100%-16rem)]">
        
        {/* --- HEADER (Barra Superior) --- */}
        <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm shrink-0">
           
           {/* Título da Página Atual */}
           <h2 className="font-bold text-xl text-text-primary capitalize">
             {getPageTitle()}
           </h2>
           
           {/* Área direita do Header (Notificações, etc) */}
           <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
              </button>
           </div>
        </header>

        {/* --- CONTEÚDO DA PÁGINA (Outlet) --- */}
        <div className="p-4 flex-1 overflow-y-auto bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </div>

      </main>
    </div>
  )
}