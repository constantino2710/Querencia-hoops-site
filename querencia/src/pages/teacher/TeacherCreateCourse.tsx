/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'

export default function TeacherCreateCourse() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false) // Estado para o upload
  
  // Estado separado para o arquivo selecionado
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Função que roda quando o usuário escolhe um arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      // Cria uma URL temporária só para mostrar o preview na tela
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  // Função auxiliar para fazer o upload da imagem
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      
      // Cria um nome único para o arquivo: ID_DO_USER/TIMESTAMP_NOME
      const fileExt = file.name.split('.').pop()
      const fileName = `${session!.user.id}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails') // Nome do Bucket que criamos no SQL
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Pega a URL pública
      const { data } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload da imagem.')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!session?.user) return

    try {
      let finalThumbnailUrl = ''

      // 1. Se tiver arquivo selecionado, faz o upload primeiro
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile)
        if (uploadedUrl) finalThumbnailUrl = uploadedUrl
      }

      // 2. Prepara o preço
      const priceFloat = parseFloat(formData.price.replace(',', '.')) || 0
      const priceInCents = Math.round(priceFloat * 100)

      // 3. Salva no Banco de Dados
      const { error } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          price_cents: priceInCents,
          thumbnail_url: finalThumbnailUrl, // Salva a URL gerada pelo Supabase
          teacher_id: session.user.id,
          status: 'DRAFT'
        })

      if (error) throw error

      navigate('/teacher/courses')

    } catch (error: any) {
      alert('Erro ao criar curso: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-surface p-8 rounded-lg shadow-sm border border-border transition-colors duration-300">
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Criar Novo Curso</h2>
        <p className="text-text-secondary mb-8">
          Preencha as informações abaixo.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* UPLOAD DE IMAGEM */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Capa do Curso</label>
            
            <div className="flex items-start gap-4">
              {/* Preview da Imagem */}
              <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 border border-border rounded overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-text-secondary">Sem imagem</span>
                )}
              </div>

              {/* Input de Arquivo */}
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*" // Só aceita imagens
                  onChange={handleFileChange}
                  className="block w-full text-sm text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
                <p className="text-xs text-text-secondary mt-1">PNG, JPG ou GIF até 2MB.</p>
              </div>
            </div>
          </div>

          {/* TÍTULO */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título do Curso</label>
            <input 
              name="title"
              type="text" 
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 rounded border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Ex: Introdução ao Marketing Digital" 
            />
          </div>

          {/* PREÇO */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Preço (R$)</label>
            <input 
              name="price"
              type="number" 
              step="0.01"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full p-3 rounded border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="0.00" 
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição Detalhada</label>
            <textarea 
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 rounded border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-colors h-40 resize-y"
              placeholder="O que os alunos vão aprender neste curso?"
            ></textarea>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={() => navigate('/teacher/courses')}
              className="px-6 py-3 rounded border border-border text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(loading || uploading) ? 'Enviando...' : 'Salvar Curso'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}