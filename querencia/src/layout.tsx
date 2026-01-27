import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { CartSidebar } from './components/CartSidebar'
import { Header } from './components/header'

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false) // Estado centralizado
  const [isMobile, setIsMobile] = useState(false)
  const isCompact = isCollapsed || isMobile
  const location = useLocation()
  const isPlayerRoute = location.pathname.includes('/player')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return (
   <div className="flex h-screen bg-background text-text-primary transition-colors duration-300">      
      {/* Passamos o estado e a função para a Sidebar */}
      {!isPlayerRoute && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* O main agora reage diretamente ao estado do Layout */}
      <main 
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${
          isPlayerRoute ? 'ml-0' : 'ml-20'
        } ${isPlayerRoute ? '' : isCompact ? 'md:ml-20' : 'md:ml-64'}`}
      >
        {!isPlayerRoute && <Header />}
        
        <div className={`${isPlayerRoute ? 'p-0' : 'p-4 md:p-8'} flex-1 min-h-0 overflow-hidden bg-background`}>
          <div className={`${isPlayerRoute ? 'w-full' : 'max-w-[1600px] mx-auto w-full'}`}>
            <Outlet />
          </div>
        </div>
      </main>
      
      {!isPlayerRoute && <CartSidebar />}
    </div>
  )
}