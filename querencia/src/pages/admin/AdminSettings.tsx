import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Save, Type } from 'lucide-react'

export default function AdminSettings() {
  const [watermarkText, setWatermarkText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('watermark_text')
        .limit(1)
        .single()

      if (error) throw error
      setWatermarkText(data.watermark_text || '')
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from('site_settings')
        .update({ watermark_text: watermarkText, updated_at: new Date().toISOString() })
        .not('id', 'is', null)

      if (error) throw error

      setMessage({ type: 'success', text: 'Watermark salvo com sucesso!' })
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="text-xl font-bold text-text-primary mb-6">Configurações da Plataforma</h2>

        <div className="space-y-6">
          {/* Seção Watermark */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-text-primary">Watermark do Player</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Texto exibido sobre o vídeo para proteção do conteúdo. Deixe vazio para desativar.
            </p>

            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Ex: Conteúdo exclusivo - Proibida a reprodução"
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Preview */}
            {watermarkText && (
              <div className="mt-4">
                <p className="text-xs text-text-secondary mb-2">Preview:</p>
                <div className="relative bg-black rounded-lg h-32 flex items-center justify-center overflow-hidden">
                  <span className="text-white/40 text-sm">Vídeo da aula</span>
                  <span className="absolute text-white/20 text-sm font-medium pointer-events-none select-none animate-pulse">
                    {watermarkText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}
