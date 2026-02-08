import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { CartSidebar } from './components/CartSidebar'
import { Header } from './components/header'

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const isCompact = isCollapsed || isMobile
  const location = useLocation()
  const isPlayerRoute = location.pathname.includes('/player')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)
    handleChange()

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="flex h-screen w-full bg-background text-text-primary transition-colors duration-300 overflow-hidden">      
      {!isPlayerRoute && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      <main 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isPlayerRoute ? 'ml-0' : 'ml-20'
        } ${isPlayerRoute ? '' : isCompact ? 'md:ml-20' : 'md:ml-64'}`}
      >
        {!isPlayerRoute && <Header />}
        
        {/* A mágica acontece aqui:
           - overflow-y-auto: Só mostra o scroll se precisar.
           - h-full: Ocupa o espaço restante abaixo do Header.
        */}
        <div className={`flex-1 overflow-y-auto ${isPlayerRoute ? 'p-0' : 'p-4 md:p-8'}`}>
          <div className={`${isPlayerRoute ? 'w-full' : 'max-w-[1600px] mx-auto w-full'} pb-12`}>
            <Outlet />
          </div>
        </div>
      </main>
      
      {!isPlayerRoute && <CartSidebar />}
    </div>
  )
}