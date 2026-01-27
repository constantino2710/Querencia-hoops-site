import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react'

interface CoursePlayerHeaderProps {
  title: string
  progress: number
  completedLessons: number
  totalLessons: number
  courseId: string
}

export function CoursePlayerHeader({
  title,
  progress,
  completedLessons,
  totalLessons,
  courseId
}: CoursePlayerHeaderProps) {
  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto w-full px-4 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          {/* Left */}
          <div className="min-w-0">
            <Link
              to={`/student/course/${courseId}`}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para detalhes do curso
            </Link>

            <div className="mt-2 flex items-start gap-3">
              <div className="mt-1 hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/70">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight truncate">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-text-secondary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-text-primary">{completedLessons}</span>
                  <span>de</span>
                  <span className="font-medium text-text-primary">{totalLessons}</span>
                  <span>aulas concluídas</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right - Progress */}
          <div className="w-full md:w-[360px] rounded-2xl border border-border bg-gradient-to-b from-gray-50/70 to-transparent dark:from-gray-800/40 shadow-sm px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
                Progresso
              </p>

              <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-2.5 py-1 text-xs font-semibold text-text-primary">
                {progress}%
              </span>
            </div>

            <div className="mt-3 h-2.5 rounded-full bg-gray-200/80 dark:bg-gray-700/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span>Concluídas</span>
              <span>
                <span className="font-semibold text-text-primary">{completedLessons}</span>/{totalLessons}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
