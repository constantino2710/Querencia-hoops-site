/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { Camera, Save, User, Mail, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

export default function ProfileSettings() {
  const { session } = useAuth()
  
  // Estados do Formulário
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // ESTADO DA NOTIFICAÇÃO (TOAST)
  const [notification, setNotification] = useState<{
    message: string,
    type: 'success' | 'error'
  } | null>(null)

  // Carregar dados iniciais do metadados da sessão e do banco de dados
  useEffect(() => {
    if (session?.user) {
      const { user_metadata, email: userEmail } = session.user
      setName(user_metadata?.name || '')
      setEmail(userEmail || '')
      setAvatarUrl(user_metadata?.avatar_url || null)
    }
  }, [session])

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Upload de Imagem CORRIGIDO
// src/pages/ProfileSetings.tsx

async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
  try {
    setUploading(true)
    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${session?.user.id}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    // 1. Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 2. Obter a URL Pública
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data.publicUrl
    
    // 3. ATUALIZAÇÃO IMEDIATA NO BANCO (Garante que não fique null)
    if (session?.user.id) {
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id)
      
      if (dbUpdateError) throw dbUpdateError
    }

    setAvatarUrl(publicUrl)
    showNotification('Foto atualizada com sucesso!', 'success')
    
  } catch (error: any) {
    showNotification('Erro ao processar imagem.', 'error')
    console.error('Erro no upload:', error.message)
  } finally {
    setUploading(false)
  }
}

  // Salvar Perfil Completo
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!session?.user) throw new Error('Usuário não logado')
      const newName = name.trim()
      const newAvatarUrl = avatarUrl ?? session.user.user_metadata.avatar_url ?? null

      // 1. Atualiza os metadados do Auth (Sessão)
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: newName, avatar_url: newAvatarUrl }      })
      if (authError) throw authError

      // 2. Atualiza a tabela pública 'users'
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: newName,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (dbError) throw dbError

      showNotification('Perfil atualizado com sucesso!', 'success')
      
      // Pequeno delay para o usuário ver o sucesso antes de recarregar
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      showNotification('Erro ao atualizar perfil.', 'error')
      console.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 relative py-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Meu Perfil</h1>
        <p className="text-text-secondary mt-1">Gerencie suas informações pessoais e foto de exibição.</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex justify-center sm:justify-start">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-surface bg-gray-200 overflow-hidden shadow-md">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-text-secondary bg-gray-100 dark:bg-gray-800">
                    {name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <label 
                className={`absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-105 border-4 border-surface ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-gray-50 dark:bg-gray-800/50 text-text-secondary cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading || uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' 
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}