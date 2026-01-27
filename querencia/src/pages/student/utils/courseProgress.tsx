export type CourseProgress = {
  totalLessons: number
  completedLessons: number
  percent: number
}

export function getStoredCourseProgress(
  userId: string,
  courseId: string,
  lessonIds: string[]
): CourseProgress {
  const totalLessons = lessonIds.length

  if (!userId || !courseId || totalLessons === 0) {
    return { totalLessons, completedLessons: 0, percent: 0 }
  }

  const storageKey = `course-progress:${userId}:${courseId}`
  const stored = localStorage.getItem(storageKey)

  if (!stored) {
    return { totalLessons, completedLessons: 0, percent: 0 }
  }

  try {
    const parsed = JSON.parse(stored) as string[]
    const validLessonIds = new Set(lessonIds)
    const completedLessons = parsed.filter((lessonId) => validLessonIds.has(lessonId)).length
    const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
    return { totalLessons, completedLessons, percent }
  } catch {
    return { totalLessons, completedLessons: 0, percent: 0 }
  }
}