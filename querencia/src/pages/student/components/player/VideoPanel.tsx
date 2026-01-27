interface VideoPanelProps {
  title: string
  description?: string | null
  embedUrl: string | null
}

export function VideoPanel({ title, description, embedUrl }: VideoPanelProps) {
  return (
    <section className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="aspect-video bg-black">
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
      </div>

      <div className="p-6 space-y-2">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-secondary leading-relaxed">{description}</p>}
      </div>
    </section>
  )
}