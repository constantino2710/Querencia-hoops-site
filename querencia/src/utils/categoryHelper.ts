// src/utils/categoryHelper.ts

export const getCategoryIcon = (slug: string | undefined | null) => {
  switch (slug) {
    case 'tecnica':
      return '🏀' // Bola de basquete
    case 'condicionamento':
      return '⚡' // Raio/Energia
    case 'psicologia':
      return '🧠' // Cérebro
    case 'fisico':
      return '💪' // Músculo
    default:
      return '📚' // Genérico
  }
}

export const getCategoryColor = (slug: string | undefined | null) => {
  switch (slug) {
    case 'tecnica':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'condicionamento':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'psicologia':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'fisico':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}