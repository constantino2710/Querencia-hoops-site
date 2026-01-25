/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

// Interface atualizada para suportar o sistema de repasse financeiro
export interface CartItem {
  id: string
  title: string
  priceCents: number | null
  thumbnailUrl: string | null
  teacherName: string | null
  teacherId: string // ID necessário para a tabela teacher_earnings
}

interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  checkout: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { session } = useAuth()

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const exists = prev.some(existing => existing.id === item.id)
      if (exists) return prev
      return [...prev, item]
    })
    setIsOpen(true)
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clear = () => {
    setItems([])
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen(prev => !prev)

  const checkout = async () => {
    if (!session?.user?.id) {
      alert('Por favor, faça login para finalizar a matrícula.')
      return
    }

    try {
      // Processa cada curso do carrinho individualmente
      for (const item of items) {
        // 1. Verifica se o utilizador já está matriculado (evita erro 409 Conflict)
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', session.user.id)
          .eq('course_id', item.id)
          .maybeSingle()

        if (existingEnrollment) {
          console.warn(`Já matriculado no curso: ${item.title}`)
          continue // Pula para o próximo curso do carrinho
        }

        // 2. Cria a Matrícula
        const { data: enrollment, error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            student_id: session.user.id,
            course_id: item.id,
            price_paid_cents: item.priceCents || 0,
            status: 'ACTIVE'
          })
          .select()
          .single()

        if (enrollError) throw enrollError

        // 3. Regista o Pagamento (Simulado como 'MANUAL' e 'PAID')
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            enrollment_id: enrollment.id,
            amount_cents: item.priceCents || 0,
            provider: 'MANUAL',
            status: 'PAID'
          })

        if (paymentError) throw paymentError

        // 4. Regista os Ganhos do Professor (Repasse Financeiro)
        if (item.teacherId) {
          const grossAmount = item.priceCents || 0
          const platformFeePercent = 0.10 // Taxa de 10% da plataforma
          const feeAmount = Math.round(grossAmount * platformFeePercent)
          const netAmount = grossAmount - feeAmount

          const { error: earningError } = await supabase
            .from('teacher_earnings')
            .insert({
              enrollment_id: enrollment.id,
              teacher_id: item.teacherId,
              gross_amount_cents: grossAmount,
              platform_fee_cents: feeAmount,
              net_amount_cents: netAmount
            })

          if (earningError) throw earningError
        }
      }

      alert('Matrículas processadas com sucesso!')
      clear()
      closeCart()
    } catch (error) {
      console.error('Erro detalhado no checkout:', error)
      alert('Ocorreu um erro ao finalizar as matrículas. Tente novamente.')
    }
  }

  const value = useMemo(
    () => ({
      items,
      isOpen,
      addItem,
      removeItem,
      clear,
      openCart,
      closeCart,
      toggleCart,
      checkout
    }),
    [items, isOpen, session]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}