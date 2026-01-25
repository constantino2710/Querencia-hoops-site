import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { CartSidebar } from './components/CartSidebar'
import { Header } from './components/header'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
      
      <Sidebar />

      {/* ml-64 compensa a largura da sidebar fixa */}
      <main className="ml-[16rem] flex-1 flex flex-col w-[calc(100%-16rem)]">
        <Header />
        
        {/* Componente Header centralizado */}

        {/* Padding 4 (1rem) em todos os lados para o conteúdo das páginas */}
        <div className="p-8 flex-1 overflow-y-auto bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </div>

      </main>
      <CartSidebar />
    </div>
  )
}