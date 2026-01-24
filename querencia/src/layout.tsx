import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar' // Ajuste o caminho se necessário

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      
      {/* 1. Sidebar Fixa à esquerda */}
      <Sidebar />

      {/* 2. Conteúdo Principal com Margem
         - ml-64: Empurra o conteúdo para direita (espaço da sidebar)
         - w-[calc(100%-16rem)]: Garante que o conteúdo ocupe o resto da tela corretamente
      */}
      <main className="ml-64 min-h-screen w-[calc(100%-16rem)]">
        
        {/* Container para limitar a largura em telas muito grandes (opcional, mas recomendado) */}
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
        
      </main>
    </div>
  )
}