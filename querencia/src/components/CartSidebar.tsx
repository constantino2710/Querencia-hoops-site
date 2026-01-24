import { X, Trash2 } from 'lucide-react'
import { useCart } from '../CartContext'

const formatPrice = (cents: number | null) => {
  if (!cents) return 'Grátis'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, clear } = useCart()

  return (
    <>
      <button
        type="button"
        aria-hidden={!isOpen}
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface border-l border-border shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <p className="text-sm text-text-secondary">Seu carrinho</p>
              <h3 className="text-xl font-bold text-text-primary">
                {items.length > 0 ? `${items.length} curso${items.length > 1 ? 's' : ''}` : 'Carrinho vazio'}
              </h3>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-full p-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-text-secondary">
                <p className="text-sm">Adicione cursos para ver o carrinho.</p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="h-16 w-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div>
                      <p className="font-semibold text-text-primary line-clamp-2">{item.title}</p>
                      {item.teacherName && (
                        <p className="text-xs text-text-secondary">Prof. {item.teacherName}</p>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{formatPrice(item.priceCents)}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-full p-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Remover do carrinho"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border px-6 py-4 space-y-3">
            <button
              type="button"
              onClick={clear}
              disabled={items.length === 0}
              className="w-full rounded-lg border border-border py-2 text-sm font-semibold text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Limpar carrinho
            </button>
            <button
              type="button"
              disabled={items.length === 0}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-bold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Finalizar compra
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}