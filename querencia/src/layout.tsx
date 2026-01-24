import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/header'

export function Layout() {
  return (
    // bg-background garante que o fundo mude (cinza claro <-> cinza escuro)
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-4 relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}