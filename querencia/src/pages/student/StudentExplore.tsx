export default function StudentExplore() {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
      <h2 className="text-xl font-bold text-text-primary mb-2">Catálogo de Cursos</h2>
      <p className="text-text-secondary">
        Explore nossa biblioteca e encontre o curso ideal para você. (Esta área ficará visível no modo {localStorage.getItem('theme') === 'dark' ? 'escuro' : 'claro'}).
      </p>
      
      {/* Exemplo de Card interno */}
      <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border p-4 rounded bg-background">
            <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded mb-3 animate-pulse"></div>
            <h3 className="font-bold text-text-primary">Curso Exemplo {i}</h3>
            <p className="text-sm text-text-secondary">Descrição breve do curso...</p>
          </div>
        ))}
      </div>
    </div>
  )
}