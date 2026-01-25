import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { CartSidebar } from './components/CartSidebar'
import { useCart } from './CartContext'
import { useAuth } from './AuthContext' // Importação necessária
import { Bell, ShoppingCart } from 'lucide-react'

export function Layout() {
  const { items, openCart } = useCart()
  const { role } = useAuth() // Obtendo a role do contexto de autenticação
  const location = useLocation()

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
    
    return 'Hoops Hub'
  }

  return (
    <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
      
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col min-h-screen w-[calc(100%-16rem)]">
        
        <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm shrink-0">
           
           <h2 className="font-bold text-xl text-text-primary capitalize">
             {getPageTitle()}
           </h2>
           
           <div className="flex items-center gap-4">
              {/* Lógica condicional: renderiza o botão do carrinho apenas se for STUDENT */}
              {role === 'STUDENT' && (
                <button
                  type="button"
                  onClick={openCart}
                  className="relative flex items-center justify-center rounded-full p-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Abrir carrinho"
                >
                  <ShoppingCart size={20} />
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white text-center">
                    {items.length}
                  </span>
                </button>
              )}

              <button className="p-2 rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
              </button>
           </div>
        </header>

        <div className="p-4 flex-1 overflow-y-auto bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </div>

      </main>
      <CartSidebar />
    </div>
  )
}