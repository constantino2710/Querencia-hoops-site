export default function AdminStudents() {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
      <h2 className="text-lg font-bold text-text-primary mb-4">Gestão de Alunos</h2>
      <p className="text-text-secondary mb-6">Lista completa de estudantes matriculados na plataforma.</p>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded text-yellow-800 dark:text-yellow-200">
        <strong>Atenção:</strong> Esta área contém dados sensíveis dos alunos.
      </div>
    </div>
  )
}