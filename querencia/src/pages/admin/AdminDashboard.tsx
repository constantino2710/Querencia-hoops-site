export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cards de Métricas */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
        <h3 className="text-text-secondary text-sm font-medium uppercase">Total de Usuários</h3>
        <p className="text-3xl font-bold text-text-primary mt-2">1,234</p>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
        <h3 className="text-text-secondary text-sm font-medium uppercase">Receita Mensal</h3>
        <p className="text-3xl font-bold text-blue-500 mt-2">R$ 45k</p>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
        <h3 className="text-text-secondary text-sm font-medium uppercase">Cursos Ativos</h3>
        <p className="text-3xl font-bold text-purple-500 mt-2">89</p>
      </div>
      
      {/* Área Maior */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border col-span-1 md:col-span-3 transition-colors duration-300">
        <h2 className="text-xl font-bold text-text-primary mb-4">Visão Geral do Sistema</h2>
        <div className="h-64 bg-background rounded flex items-center justify-center border border-border">
          <p className="text-text-secondary">Gráfico de crescimento da plataforma</p>
        </div>
      </div>
    </div>
  )
}