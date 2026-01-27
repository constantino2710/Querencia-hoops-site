/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, Lock } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'
import { CoursePlayerHeader } from './components/player/CoursePlayerHeader'
import { VideoPanel } from './components/player/VideoPanel'
import { LessonList } from './components/player/LessonList'

interface Lesson {
  id: string
  title: string
  position: number
  youtube_url: string | null
}

interface CourseSection {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

interface CoursePlayerData {
  id: string
  title: string
  description: string | null
  course_sections: CourseSection[]
}

type RawLesson = {
  id: string
  title: string
  position: number
  youtube_url: string | null
}

type RawSection = {
  id: string
  title: string
  position: number
  lessons: RawLesson[] | null
}

type RawCourse = {
  id: string
  title: string
  description: string | null
  course_sections: RawSection[] | null
}

function getYoutubeEmbedUrl(url: string | null) {
  if (!url) return null
  try {
    const parsed = new URL(url)

    // youtu.be/<id>
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    // youtube.com/watch?v=<id>
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`

      // youtube.com/shorts/<id>
      const shorts = parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1]
      if (shorts) return `https://www.youtube.com/embed/${shorts}`

      // youtube.com/embed/<id>
      const embed = parsed.pathname.match(/\/embed\/([^/]+)/)?.[1]
      if (embed) return `https://www.youtube.com/embed/${embed}`
    }
  } catch {
    return null
  }
  return null
}

function normalizeCourse(data: RawCourse): CoursePlayerData {
  const sections = (data.course_sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      id: s.id,
      title: s.title,
      position: s.position,
      lessons: (s.lessons ?? []).slice().sort((a, b) => a.position - b.position)
    }))

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    course_sections: sections
  }
}

function Spinner() {
  return (
    <div className="h-12 w-12 rounded-full border-2 border-border border-t-blue-600 animate-spin" />
  )
}

function CardMessage({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-border bg-background/70 p-2">{icon}</div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{description}</p>
            </div>
          </div>

          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default function StudentCoursePlayer() {
  const { id } = useParams()
  const { session } = useAuth()

  const [course, setCourse] = React.useState<CoursePlayerData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isEnrolled, setIsEnrolled] = React.useState(false)
  const [activeLessonId, setActiveLessonId] = React.useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = React.useState<Set<string>>(new Set())
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const storageKey = React.useMemo(() => {
    return session?.user && id ? `course-progress:${session.user.id}:${id}` : null
  }, [session?.user, id])

  // load local progress
  React.useEffect(() => {
    if (!storageKey) return
    const stored = localStorage.getItem(storageKey)
    if (!stored) return
    try {
      setCompletedLessons(new Set(JSON.parse(stored)))
    } catch {
      setCompletedLessons(new Set())
    }
  }, [storageKey])

  // persist local progress
  React.useEffect(() => {
    if (!storageKey) return
    localStorage.setItem(storageKey, JSON.stringify(Array.from(completedLessons)))
  }, [completedLessons, storageKey])

  const fetchCourseData = React.useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      if (!id) return

      const { data, error } = await supabase
        .from('courses')
        .select(
          `
          id,
          title,
          description,
          course_sections(
            id, title, position,
            lessons(id, title, position, youtube_url)
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        setCourse(null)
        return
      }

      const normalized = normalizeCourse(data as RawCourse)
      setCourse(normalized)

      // enrollment gate
      if (session?.user) {
        const { data: enrollment, error: enrollErr } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('student_id', session.user.id)
          .maybeSingle()

        if (enrollErr) throw enrollErr
        setIsEnrolled(Boolean(enrollment))
      } else {
        setIsEnrolled(false)
      }
    } catch (e: any) {
      console.error('Erro ao carregar curso:', e?.message || e)
      setErrorMsg('Não foi possível carregar o curso agora. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }, [id, session?.user])

  React.useEffect(() => {
    fetchCourseData()
  }, [fetchCourseData])

  const lessons = React.useMemo(() => {
    return course?.course_sections?.flatMap((s) => s.lessons || []) ?? []
  }, [course?.course_sections])

  // keep active lesson valid (and default to first)
  React.useEffect(() => {
    if (!lessons.length) return
    const exists = activeLessonId ? lessons.some((l) => l.id === activeLessonId) : false
    if (!exists) setActiveLessonId(lessons[0].id)
  }, [lessons, activeLessonId])

  const activeLesson = React.useMemo(() => {
    if (!lessons.length) return null
    return lessons.find((l) => l.id === activeLessonId) ?? lessons[0]
  }, [lessons, activeLessonId])

  const { totalLessons, completedCount, progress } = React.useMemo(() => {
    const total = lessons.length
    const done = Array.from(completedLessons).filter((lessonId) => lessons.some((l) => l.id === lessonId)).length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { totalLessons: total, completedCount: done, progress: pct }
  }, [lessons, completedLessons])

  const toggleLesson = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev)
      next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <CardMessage
        icon={<AlertTriangle className="h-5 w-5 text-blue-600" />}
        title="Ops…"
        description={errorMsg}
        action={
          <button
            type="button"
            onClick={fetchCourseData}
            className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        }
      />
    )
  }

  if (!course) {
    return (
      <CardMessage
        icon={<AlertTriangle className="h-5 w-5 text-blue-600" />}
        title="Curso não encontrado"
        description="Pode ser que ele tenha sido removido ou o link esteja incorreto."
        action={
          <Link
            to="/student"
            className="w-full inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 font-semibold text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            Voltar
          </Link>
        }
      />
    )
  }

  if (!isEnrolled) {
    return (
      <CardMessage
        icon={<Lock className="h-5 w-5 text-blue-600" />}
        title="Conteúdo bloqueado"
        description="Apenas alunos matriculados podem assistir a este curso."
        action={
          <Link
            to={`/student/course/${course.id}`}
            className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver detalhes do curso
          </Link>
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <CoursePlayerHeader
        title={course.title}
        progress={progress}
        completedLessons={completedCount}
        totalLessons={totalLessons}
        courseId={course.id}
      />

      <main className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 items-start">
          <div className="space-y-6">
            <VideoPanel
              title={activeLesson?.title || 'Selecione uma aula'}
              description={course.description}
              embedUrl={getYoutubeEmbedUrl(activeLesson?.youtube_url ?? null)}
            />
          </div>

          <div className="lg:sticky lg:top-6">
            <LessonList
              sections={course.course_sections}
              activeLessonId={activeLesson?.id ?? null}
              completedLessons={completedLessons}
              onSelectLesson={setActiveLessonId}
              onToggleLesson={toggleLesson}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
