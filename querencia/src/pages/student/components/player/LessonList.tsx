/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as React from 'react'
import { CheckCircle2, ChevronDown, Circle, PlayCircle } from 'lucide-react'

interface LessonItem {
  id: string
  title: string
}

interface LessonSection {
  id: string
  title: string
  lessons: LessonItem[]
}

interface LessonListProps {
  sections: LessonSection[]
  activeLessonId: string | null
  completedLessons: Set<string>
  onSelectLesson: (lessonId: string) => void
  onToggleLesson: (lessonId: string) => void
}

export function LessonList({
  sections,
  activeLessonId,
  completedLessons,
  onSelectLesson,
  onToggleLesson
}: LessonListProps) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(() => new Set())

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId)
      return next
    })
  }

  const isSectionOpen = (sectionId: string) => openSections.has(sectionId)

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-b from-gray-50/80 to-transparent dark:from-gray-800/40">
        <p className="text-xs text-text-secondary">Marque o que já foi concluído</p>
        <div className="rounded-xl border border-border bg-background/70 p-2">
          <CheckCircle2 className="text-blue-600" size={18} />
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
        {sections.map((section) => {
          const open = isSectionOpen(section.id)

          return (
            <div key={section.id} className="border-b border-border last:border-0">
              {/* Section dropdown button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={[
                  'w-full px-5 py-3 bg-background flex items-center justify-between gap-3',
                  'hover:bg-gray-50/70 dark:hover:bg-gray-800/35 transition-colors'
                ].join(' ')}
                aria-expanded={open}
              >
                <p className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold text-left">
                  {section.title}
                </p>

                <ChevronDown
                  className={[
                    'h-4 w-4 text-text-secondary transition-transform',
                    open ? 'rotate-180' : 'rotate-0'
                  ].join(' ')}
                />
              </button>

              {/* Collapsible content */}
              <div
                className={[
                  'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                ].join(' ')}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 px-3 py-3">
                    {section.lessons.map((lesson) => {
                      const isActive = activeLessonId === lesson.id
                      const isCompleted = completedLessons.has(lesson.id)
                      const StatusIcon = isCompleted ? CheckCircle2 : isActive ? PlayCircle : Circle

                      return (
                        <div
                          key={lesson.id}
                          className={[
                            'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition',
                            isActive
                              ? 'border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-900/15 ring-2 ring-blue-500/15'
                              : 'border-transparent hover:border-border hover:bg-gray-50/70 dark:hover:bg-gray-800/35'
                          ].join(' ')}
                        >
                          {/* Status */}
                          <div className="flex items-center justify-center">
                            <StatusIcon
                              className={[
                                'h-5 w-5',
                                isCompleted
                                  ? 'text-blue-600'
                                  : isActive
                                    ? 'text-blue-600'
                                    : 'text-text-secondary/70'
                              ].join(' ')}
                            />
                          </div>

                          {/* Title */}
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p
                              className={[
                                'text-sm font-medium leading-snug truncate',
                                isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
                              ].join(' ')}
                              title={lesson.title}
                            >
                              {lesson.title}
                            </p>
                            <p className="mt-0.5 text-xs text-text-secondary/80">
                              {isCompleted ? 'Concluída' : isActive ? 'Assistindo agora' : 'Pendente'}
                            </p>
                          </button>

                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() => onToggleLesson(lesson.id)}
                            className={[
                              'shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition',
                              isCompleted
                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/15 dark:text-blue-300'
                                : 'border-border bg-background hover:bg-gray-50 dark:hover:bg-gray-800/40 text-text-secondary'
                            ].join(' ')}
                            aria-pressed={isCompleted}
                          >
                            <span className="hidden sm:inline">
                              {isCompleted ? 'Concluída' : 'Marcar'}
                            </span>
                            <span className="sm:hidden">{isCompleted ? '✓' : '+'}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
