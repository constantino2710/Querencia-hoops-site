import { useEffect, useState } from 'react'
import { supabase } from '../../../../supabaseClient'

interface VideoPanelProps {
  title: string
  description?: string | null
  embedUrl: string | null
}

export function VideoPanel({ title, description, embedUrl }: VideoPanelProps) {
  const [watermark, setWatermark] = useState('')

  useEffect(() => {
    async function fetchWatermark() {
      const { data } = await supabase
        .from('site_settings')
        .select('watermark_text')
        .limit(1)
        .single()

      if (data?.watermark_text) {
        setWatermark(data.watermark_text)
      }
    }
    fetchWatermark()
  }, [])

  return (
    <section className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="aspect-video bg-black relative" onContextMenu={(e) => e.preventDefault()}>
        {embedUrl ? (
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            Vídeo indisponível para esta aula
          </div>
        )}

        {/* Watermark overlay */}
        {watermark && (
          <div className="absolute bottom-3 right-3 pointer-events-none select-none">
            <span className="text-white/70 text-xs md:text-sm font-semibold whitespace-nowrap">
              {watermark}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-2">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-secondary leading-relaxed">{description}</p>}
      </div>
    </section>
  )
}
