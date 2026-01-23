export default function TeacherDashboard() {
  return (
    <div className="grid gap-6">
      {/* Card de Resumo */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
        <h2 className="text-lg font-bold text-text-primary mb-1">Faturamento Total</h2>
        <p className="text-3xl font-bold text-green-500">R$ 12.450,00</p>
        <p className="text-text-secondary text-sm mt-2">Atualizado hoje</p>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
        <h2 className="text-lg font-bold text-text-primary mb-4">Últimas Vendas</h2>
        <p className="text-text-secondary">Aqui aparecerá o gráfico de vendas.</p>
      </div>
    </div>
  )
}