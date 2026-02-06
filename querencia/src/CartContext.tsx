/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { createCheckoutSession } from './services/enrollmentService'

export interface CartItem {
  id: string
  title: string
  priceCents: number | null
  thumbnailUrl: string | null
  teacherName: string | null
  teacherId: string
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

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.some(exists => exists.id === item.id)) return prev
      return [...prev, item]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  const checkout = useCallback(async () => {
    if (!session?.user?.id) {
      alert('Por favor, faça login para finalizar a matrícula.')
      return
    }
    if (items.length === 0) return

    try {
      const checkoutUrl = await createCheckoutSession(session.user.id, items)
      if (checkoutUrl) {
        clear()
        window.location.href = checkoutUrl // Redireciona para a Pagar.me
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao processar checkout.')
    }
  }, [items, session, clear])

  const value = useMemo(() => ({
    items, isOpen, addItem, removeItem, clear, openCart, closeCart, toggleCart, checkout
  }), [items, isOpen, addItem, removeItem, clear, openCart, closeCart, toggleCart, checkout])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}