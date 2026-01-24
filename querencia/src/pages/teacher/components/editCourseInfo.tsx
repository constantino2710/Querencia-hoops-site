import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import { getCategoryIcon } from '../../../utils/categoryHelper'
import type { CourseWithDetails } from './TeacherCourseCard'

interface EditCourseInfoProps {
  course: CourseWithDetails
  onUpdate: () => void
  onClose: () => void
}

interface Category {
  id: string
  name: string
  slug: string
}

export function EditCourseInfo({ course, onUpdate, onClose }: EditCourseInfoProps) {
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description || '')
  const [price, setPrice] = useState(course.price_cents ? (course.price_cents / 100).toString() : '')
  const [categoryId, setCategoryId] = useState(course.category_id || '')
  const [status, setStatus] = useState(course.status || 'DRAFT')
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(course.thumbnail_url)
  
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  async function uploadImage(file: File, userId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage.from('course-thumbnails').upload(filePath, file)
    if (error) throw error

    const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let thumbnailUrl = course.thumbnail_url

      if (imageFile) {
        const url = await uploadImage(imageFile, course.teacher_id)
        if (url) thumbnailUrl = url
      }

      const priceInCents = price ? Math.round(Number(price) * 100) : null

      const { error } = await supabase
        .from('courses')
        .update({
          title,
          description,
          price_cents: priceInCents,
          category_id: categoryId,
          status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          thumbnail_url: thumbnailUrl
        })
        .eq('id', course.id)

      if (error) throw error

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      alert('Erro ao atualizar informações.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'PUBLISHED': return 'text-green-600 font-medium'
      case 'ARCHIVED': return 'text-gray-500'
      default: return 'text-yellow-600'
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
            className={`w-full px-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(status)}`}
          >
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-text-primary mb-1">Título</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Categoria</label>
        <div className="relative">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-2 pointer-events-none">
            {getCategoryIcon(categories.find(c => c.id === categoryId)?.slug)}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Capa do Curso</label>
        <div className="flex items-start gap-4">
          <div className="w-32 h-20 rounded-lg border border-border overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 relative">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-secondary">Sem imagem</div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
              className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Preço (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Descrição</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Salvando...' : 'Salvar Informações'}
        </button>
      </div>
    </form>
  )
}