import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { CartSidebar } from './components/CartSidebar'
import { Header } from './components/header'

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false) // Estado centralizado

  return (
    <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
      
      {/* Passamos o estado e a função para a Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* O main agora reage diretamente ao estado do Layout */}
      <main 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header />
        
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