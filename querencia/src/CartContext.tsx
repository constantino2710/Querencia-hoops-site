/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { createCheckoutSession } from './services/enrollmentService'

// Interface que define a estrutura de um item no carrinho
export interface CartItem {
  id: string
  title: string
  priceCents: number | null
  thumbnailUrl: string | null
  teacherName: string | null
  teacherId: string
}

// Interface para os valores expostos pelo Context
interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  isCheckingOut: boolean
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
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { session } = useAuth()

  // Adiciona um item ao carrinho, evitando duplicatas
  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.some(exists => exists.id === item.id)) return prev
      return [...prev, item]
    })
    setIsOpen(true)
  }, [])

  // Remove um item específico pelo ID
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  // Limpa todos os itens do carrinho
  const clear = useCallback(() => setItems([]), [])
  
  // Funções de controle de visibilidade da barra lateral
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  /**
   * Processa o checkout integrando com a Pagar.me
   */
  const checkout = useCallback(async () => {
    // Verifica se o usuário está autenticado
    if (!session?.user?.id) {
      alert('Por favor, faça login para finalizar a matrícula.')
      return
    }

    if (items.length === 0) {
      alert('Seu carrinho está vazio.')
      return
    }

    setIsCheckingOut(true)

    try {
      console.log('🛒 Iniciando checkout com itens:', items)
      console.log('👤 User ID:', session.user.id)

      // Chama o serviço que cria enrollments e processa pagamento
      const checkoutUrl = await createCheckoutSession(session.user.id, items)
      
      if (checkoutUrl) {
        console.log('✅ Checkout URL recebida:', checkoutUrl)
        clear()
        window.location.href = checkoutUrl 
      }
    } catch (error: any) {
      console.error('❌ Erro no fluxo de checkout:', error)
      alert(error.message || 'Erro ao processar checkout. Tente novamente.')
    } finally {
      setIsCheckingOut(false)
    }
  }, [items, session, clear])

  // Memoriza o valor do context para evitar re-renderizações desnecessárias
  const value = useMemo(() => ({
    items, 
    isOpen, 
    isCheckingOut,
    addItem, 
    removeItem, 
    clear, 
    openCart, 
    closeCart, 
    toggleCart, 
    checkout
  }), [items, isOpen, isCheckingOut, addItem, removeItem, clear, openCart, closeCart, toggleCart, checkout])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Hook personalizado para usar o carrinho em qualquer componente
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}