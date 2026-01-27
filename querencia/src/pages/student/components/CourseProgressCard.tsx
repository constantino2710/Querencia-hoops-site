import type { CourseProgress } from '../utils/courseProgress'
import { ProgressBar } from './ProgressBar'

interface CourseProgressCardProps {
  progress: CourseProgress
}

export function CourseProgressCard({ progress }: CourseProgressCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>Progresso do curso</span>
        <span className="font-semibold text-text-primary">{progress.percent}%</span>
      </div>
      <div className="mt-2">
        <ProgressBar value={progress.percent} />
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        {progress.completedLessons} de {progress.totalLessons} aulas concluídas
      </p>
    </div>
  )
}