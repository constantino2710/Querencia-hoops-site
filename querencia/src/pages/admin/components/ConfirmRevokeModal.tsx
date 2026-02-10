/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { supabase } from '../../../supabaseClient'
import { X, AlertTriangle } from 'lucide-react'

interface ConfirmRevokeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  enrollment: {
    id: string
    studentName: string
    courseTitle: string
  } | null
}

export function ConfirmRevokeModal({ isOpen, onClose, onSuccess, enrollment }: ConfirmRevokeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRevoke() {
    if (!enrollment) return

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ status: 'CANCELED' })
        .eq('id', enrollment.id)
        .eq('is_admin_grant', true)

      if (updateError) throw updateError

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao revogar acesso.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !enrollment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Revogar Acesso</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-text-secondary mb-4">
            Tem certeza que deseja revogar o acesso concedido?
          </p>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Aluno</span>
              <span className="text-sm font-medium text-text-primary">{enrollment.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Curso</span>
              <span className="text-sm font-medium text-text-primary">{enrollment.courseTitle}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRevoke}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Revogando...' : 'Revogar Acesso'}
          </button>
        </div>
      </div>
    </div>
  )
}
