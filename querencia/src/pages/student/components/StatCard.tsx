import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  icon?: ReactNode
  helper?: string
}

export function StatCard({ title, value, icon, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{title}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          {helper ? <p className="mt-1 text-xs text-text-secondary">{helper}</p> : null}
        </div>
        {icon ? (
          <div className="rounded-xl border border-border bg-background/70 p-2 text-blue-600">{icon}</div>
        ) : null}
      </div>
    </div>
  )
}