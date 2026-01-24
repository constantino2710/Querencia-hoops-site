import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'
import { getCategoryIcon } from '../../utils/categoryHelper'

interface Category {
  id: string
  name: string
  slug: string
}

export default function TeacherCreateCourse() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  // Estados do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  
  // Estado da Imagem
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Dados auxiliares
  const [categories, setCategories] = useState<Category[]>([])
  
  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [fetchingCategories, setFetchingCategories] = useState(true)

  // 1. Buscar categorias ao carregar
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (error) throw error
        if (data) setCategories(data)
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
      } finally {
        setFetchingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // 2. Lidar com a seleção de arquivo (Preview)
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const file = e.target.files[0]
    setImageFile(file)
    // Cria uma URL temporária para mostrar a imagem antes do upload
    setImagePreview(URL.createObjectURL(file))
  }

  // 3. Função de Upload da Imagem para o Storage
  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
      const filePath = `${session?.user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro no upload da imagem:', error)
      return null
    }
  }

  // 4. Submit do Formulário
  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user) return

    if (!categoryId) {
      alert('Por favor, selecione uma categoria.')
      return
    }

    try {
      setLoading(true)

      // a) Faz o upload da imagem se houver
      let thumbnailUrl = null
      if (imageFile) {
        thumbnailUrl = await uploadImage(imageFile)
      }

      // b) Converte preço
      const priceInCents = Math.round(Number(price) * 100)

      // c) Salva no banco
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title,
          description,
          price_cents: priceInCents,
          category_id: categoryId,
          teacher_id: session.user.id,
          thumbnail_url: thumbnailUrl, // Salva a URL da imagem
          status: 'DRAFT'
        })
        .select()
        .single()

      if (error) throw error

      // Redireciona
      navigate(`/teacher/courses/${data.id}/edit`) // Ou para /teacher/courses
      
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      alert('Erro ao criar o curso. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Novo Curso</h1>
        <p className="text-text-secondary mt-2">
          Preencha as informações básicas e adicione uma capa atraente.
        </p>
      </div>

      <form onSubmit={handleCreateCourse} className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Título do Curso</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ex: Dominando o Drible"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Categoria</label>
          <div className="relative">
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={fetchingCategories}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="" disabled>Selecione uma categoria...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categoryId && (
              <div className="absolute right-10 top-2 pointer-events-none">
                {getCategoryIcon(categories.find(c => c.id === categoryId)?.slug)}
              </div>
            )}
          </div>
        </div>

        {/* --- UPLOAD DE IMAGEM (Restaurado) --- */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Capa do Curso</label>
          
          <div className="flex items-start gap-4">
            {/* Área de Preview */}
            <div className={`w-40 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-background relative ${!imagePreview ? 'text-text-secondary' : ''}`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-center px-2">Sem imagem</span>
              )}
            </div>

            {/* Input de Arquivo */}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900/30 dark:file:text-blue-300
                  cursor-pointer"
              />
              <p className="text-xs text-text-secondary mt-2">
                Recomendado: 1280x720px (16:9). JPG ou PNG.
              </p>
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
                    required
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
                    placeholder="Descreva o que será ensinado..."
                />
            </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => navigate('/teacher/courses')}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              'Criar Curso'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}