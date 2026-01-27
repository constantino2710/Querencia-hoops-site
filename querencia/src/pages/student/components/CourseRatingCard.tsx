/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { supabase } from '../../../supabaseClient'

interface CourseRatingCardProps {
  courseId: string
  studentId: string
  isEnrolled: boolean
  initialRating: number | null
  onRatingSaved: (rating: number) => void
}

export function CourseRatingCard({
  courseId,
  studentId,
  isEnrolled,
  initialRating,
  onRatingSaved
}: CourseRatingCardProps) {
  const [savedRating, setSavedRating] = useState<number | null>(initialRating)
  const [ratingInput, setRatingInput] = useState<number>(initialRating ?? 0)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string>('')
  const [ratingSuccess, setRatingSuccess] = useState('')

  useEffect(() => {
    setSavedRating(initialRating)
    setRatingInput(initialRating ?? 0)
    setRatingError('')
    setRatingSuccess('')
  }, [initialRating, courseId])

  const handleSubmitRating = async () => {
    if (!courseId || !studentId || !isEnrolled || ratingInput < 1) return
    setRatingSubmitting(true)
    setRatingError('')
    setRatingSuccess('')
    try {
      const { error } = await supabase
        .from('course_reviews')
        .upsert(
          {
            course_id: courseId,
            student_id: studentId,
            rating: ratingInput
          },
          { onConflict: 'course_id,student_id' }
        )

      if (error) throw error

      setSavedRating(ratingInput)
      onRatingSaved(ratingInput)
      setRatingSuccess('Sua avaliação foi registrada. Obrigado!')
    } catch (error: any) {
      setRatingError(error?.message || 'Não foi possível salvar sua avaliação agora.')
    } finally {
      setRatingSubmitting(false)
    }
  }

  if (!isEnrolled) return null

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-2">Avalie este curso</h2>
      <p className="text-sm text-text-secondary mb-4">
        Sua avaliação ajuda outros alunos a escolherem o curso certo.
      </p>
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRatingInput(value)}
            className={`text-2xl transition-colors ${
              ratingInput >= value ? 'text-yellow-500' : 'text-gray-300'
            }`}
            aria-label={`Dar nota ${value}`}
          >
            ★
          </button>
        ))}
      </div>
      {savedRating ? (
        <p className="text-sm text-text-secondary mb-3">
          Sua nota atual: <span className="font-semibold text-text-primary">{savedRating}</span>
        </p>
      ) : null}
      {ratingError ? <p className="text-sm text-red-600 mb-3">{ratingError}</p> : null}
      {ratingSuccess ? <p className="text-sm text-green-600 mb-3">{ratingSuccess}</p> : null}
      <button
        type="button"
        onClick={handleSubmitRating}
        disabled={ratingSubmitting || ratingInput < 1}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {savedRating ? 'Atualizar avaliação' : 'Enviar avaliação'}
      </button>
    </div>
  )
}