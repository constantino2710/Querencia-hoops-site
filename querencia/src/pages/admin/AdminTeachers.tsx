export default function AdminTeachers() {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Professores Cadastrados</h2>
        <input 
          type="text" 
          placeholder="Buscar professor..." 
          className="border border-border bg-background text-text-primary rounded px-3 py-1 text-sm outline-none focus:border-blue-500"
        />
      </div>
      
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-text-secondary font-medium">Nome</th>
            <th className="pb-3 text-text-secondary font-medium">Email</th>
            <th className="pb-3 text-text-secondary font-medium">Status</th>
            <th className="pb-3 text-text-secondary font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="text-text-primary">
          <tr className="border-b border-border hover:bg-background transition-colors">
            <td className="py-3">João Silva</td>
            <td className="py-3 text-text-secondary">joao@email.com</td>
            <td className="py-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">Ativo</span></td>
            <td className="py-3 text-right text-blue-500 cursor-pointer hover:underline">Editar</td>
          </tr>
          {/* Mais linhas aqui... */}
        </tbody>
      </table>
    </div>
  )
}