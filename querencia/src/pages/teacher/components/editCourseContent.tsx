/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabaseClient'
import type { Database } from '../../../database.types'

type Section = Database['public']['Tables']['course_sections']['Row'] & {
  lessons: Database['public']['Tables']['lessons']['Row'][]
}

interface EditCourseContentProps {
  courseId: string
}

export function EditCourseContent({ courseId }: EditCourseContentProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para criação
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingLessonToSection, setAddingLessonToSection] = useState<string | null>(null) // ID da seção sendo editada
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonUrl, setNewLessonUrl] = useState('')

  useEffect(() => {
    fetchContent()
  }, [courseId])

  async function fetchContent() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('course_sections')
        .select(`
          *,
          lessons (*)
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true })
        // Ordena as aulas dentro das seções
        // Nota: O Supabase JS ordena o array pai, para filhos precisamos ordenar no cliente ou usar query complexa
      
      if (error) throw error
      
      if (data) {
        // Ordena as aulas no frontend por garantia
        const sortedData = data.map(section => ({
          ...section,
          lessons: section.lessons.sort((a, b) => a.position - b.position)
        }))
        setSections(sortedData)
      }
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- AÇÕES DE SEÇÃO ---
  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault()
    if (!newSectionTitle.trim()) return

    try {
      const position = sections.length + 1
      const { error } = await supabase.from('course_sections').insert({
        course_id: courseId,
        title: newSectionTitle,
        position
      })

      if (error) throw error
      
      setNewSectionTitle('')
      fetchContent()
    } catch (error) {
      alert('Erro ao criar seção')
    }
  }

  async function handleDeleteSection(id: string) {
    if(!confirm('Tem certeza? Isso apagará todas as aulas desta seção.')) return
    
    try {
      const { error } = await supabase.from('course_sections').delete().eq('id', id)
      if (error) throw error
      fetchContent()
    } catch (error) {
      alert('Erro ao deletar seção')
    }
  }

  // --- AÇÕES DE AULA ---
  async function handleAddLesson(e: React.FormEvent, sectionId: string) {
    e.preventDefault()
    if (!newLessonTitle.trim()) return

    try {
        // Encontra a seção para saber quantas aulas já tem (para definir posição)
        const section = sections.find(s => s.id === sectionId)
        const position = (section?.lessons.length || 0) + 1

        const { error } = await supabase.from('lessons').insert({
            section_id: sectionId,
            title: newLessonTitle,
            youtube_url: newLessonUrl || null,
            position
        })

        if (error) throw error

        // Limpa formulário
        setNewLessonTitle('')
        setNewLessonUrl('')
        setAddingLessonToSection(null) // Fecha o form de aula
        fetchContent()
    } catch (error) {
        alert('Erro ao criar aula')
    }
  }

  async function handleDeleteLesson(id: string) {
    if(!confirm('Deletar esta aula?')) return
    try {
        const { error } = await supabase.from('lessons').delete().eq('id', id)
        if (error) throw error
        fetchContent()
    } catch (error) {
        alert('Erro ao deletar aula')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* 1. Área para Adicionar Nova Seção */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-bold text-text-primary mb-3">Adicionar Nova Seção (Módulo)</h3>
        <form onSubmit={handleAddSection} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Introdução ao Basquete"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Adicionar
          </button>
        </form>
      </div>

      {/* 2. Lista de Seções Existentes */}
      <div className="space-y-6">
        {loading ? (
           <div className="text-center py-4 text-text-secondary">Carregando conteúdo...</div>
        ) : sections.length === 0 ? (
           <div className="text-center py-10 border-2 border-dashed border-border rounded-lg text-text-secondary">
             Nenhum conteúdo criado ainda. Adicione uma seção acima.
           </div>
        ) : (
          sections.map((section) => (
            <div key={section.id} className="bg-background border border-border rounded-xl overflow-hidden">
              
              {/* Cabeçalho da Seção */}
              <div className="bg-surface p-4 flex justify-between items-center border-b border-border">
                <h4 className="font-bold text-text-primary flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-0.5 rounded">
                        Módulo {section.position}
                    </span>
                    {section.title}
                </h4>
                <button 
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-500 hover:text-red-700 text-sm hover:underline"
                >
                    Excluir Seção
                </button>
              </div>

              {/* Lista de Aulas da Seção */}
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20 space-y-2">
                {section.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg group">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-text-secondary">
                                {lesson.position}
                            </div>
                            <div>
                                <p className="font-medium text-text-primary text-sm">{lesson.title}</p>
                                {lesson.youtube_url && (
                                    <p className="text-xs text-blue-500 truncate max-w-[200px]">{lesson.youtube_url}</p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Remover aula"
                        >
                            &times;
                        </button>
                    </div>
                ))}

                {section.lessons.length === 0 && (
                    <p className="text-sm text-text-secondary italic pl-2">Nenhuma aula nesta seção.</p>
                )}

                {/* Formulário para Adicionar Aula (Condicional) */}
                {addingLessonToSection === section.id ? (
                    <form onSubmit={(e) => handleAddLesson(e, section.id)} className="mt-4 p-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <h5 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">Nova Aula</h5>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Título da Aula"
                                autoFocus
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm outline-none focus:border-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="Link do YouTube (Opcional)"
                                value={newLessonUrl}
                                onChange={(e) => setNewLessonUrl(e.target.value)}
                                className="w-full px-3 py-2 rounded border border-border bg-surface text-sm outline-none focus:border-blue-500"
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setAddingLessonToSection(null)}
                                    className="text-sm text-text-secondary hover:text-text-primary px-3 py-1"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700"
                                >
                                    Salvar Aula
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => {
                            setAddingLessonToSection(section.id)
                            setNewLessonTitle('')
                            setNewLessonUrl('')
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 pl-1"
                    >
                        <span>+</span> Adicionar Aula
                    </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}