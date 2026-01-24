import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import { getCategoryIcon } from '../../../utils/categoryHelper'
import type { CourseWithDetails } from './TeacherCourseCard'

interface EditCourseModalProps {
  course: CourseWithDetails | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void // Função para avisar a página pai que salvou
}

interface Category {
  id: string
  name: string
  slug: string
}

export function EditCourseModal({ course, isOpen, onClose, onUpdate }: EditCourseModalProps) {
  // Estados do Formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  
  // Imagem
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Controle
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // 1. Carregar Categorias ao montar o componente
  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  // 2. Preencher o formulário quando um curso é selecionado
  useEffect(() => {
    if (course) {
      setTitle(course.title)
      setDescription(course.description || '')
      setPrice(course.price_cents ? (course.price_cents / 100).toString() : '')
      setCategoryId(course.category_id || '')
      setImagePreview(course.thumbnail_url)
      setImageFile(null) // Reseta arquivo selecionado
    }
  }, [course])

  if (!isOpen || !course) return null

  // Função de Upload (reutilizável)
  async function uploadImage(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file)

      if (error) throw error

      const { data } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      return null
    }
  }

  // Função de Salvar
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let thumbnailUrl = course!.thumbnail_url

      // Se usuário selecionou nova imagem, faz upload
      if (imageFile) {
        const url = await uploadImage(imageFile, course!.teacher_id)
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
          thumbnail_url: thumbnailUrl
        })
        .eq('id', course!.id)

      if (error) throw error

      onUpdate() // Atualiza a lista na tela de trás
      onClose()  // Fecha o modal
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      alert('Erro ao atualizar curso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-border">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-xl font-bold text-text-primary">Editar Curso</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Categoria */}
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

          {/* Imagem (Capa) */}
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
                <p className="text-xs text-text-secondary mt-1">Selecione para substituir a atual.</p>
              </div>
            </div>
          </div>

          {/* Preço e Descrição */}
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
                placeholder="0.00"
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

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}