import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { CartSidebar } from './components/CartSidebar'
import { Header } from './components/header'

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false) // Estado centralizado para manual toggle
  const [isMobile, setIsMobile] = useState(false)

  // Determina se a sidebar deve se comportar como compacta (fechada ou em mobile)
  const isCompact = isCollapsed || isMobile

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)

    // Inicializa o estado
    handleChange()

    // Listeners para mudanças de tamanho de tela
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Fallback para navegadores legados
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return (
    <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
      
      {/* Passamos o estado e a função para a Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* O main ajusta sua margem esquerda (ml) baseado no estado da sidebar.
        No mobile, a margem é fixa em 20 (ml-20).
        No desktop (md:), ela alterna entre 20 e 64.
      */}
      <main 
        className={`flex-1 flex flex-col transition-all duration-300 ml-20 ${
          isCompact ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Header />
        
        {/* Padding responsivo: p-4 em mobile e p-8 em telas maiores */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
      
      <CartSidebar />
    </div>
  )
}