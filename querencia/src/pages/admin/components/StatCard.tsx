import { type ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  variant?: 'blue' | 'green' | 'purple' | 'yellow'
}

export function StatCard({ title, value, icon, description, variant = 'blue' }: StatCardProps) {
  const variants = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    green: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800",
    yellow: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800"
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl border ${variants[variant]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</h3>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
    </div>
  )
}
