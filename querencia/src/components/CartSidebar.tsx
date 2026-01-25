import { X, Trash2 } from 'lucide-react'
import { useCart } from '../CartContext'

const formatPrice = (cents: number | null) => {
  if (!cents) return 'Grátis'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, clear, checkout } = useCart()

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
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <p className="text-sm text-text-secondary">Seu carrinho</p>
              <h3 className="text-xl font-bold text-text-primary">
                {items.length > 0 ? `${items.length} curso${items.length > 1 ? 's' : ''}` : 'Carrinho vazio'}
              </h3>
            </div>
            <button onClick={closeCart} className="rounded-full p-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-text-secondary">
                <p className="text-sm">Adicione cursos para ver o carrinho.</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="h-16 w-24 overflow-hidden rounded-lg bg-gray-100">
                    {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="font-semibold text-text-primary line-clamp-1">{item.title}</p>
                    <p className="text-xs text-text-secondary">Prof. {item.teacherName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-blue-600">{formatPrice(item.priceCents)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-text-secondary hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ações Finais */}
          <div className="border-t border-border px-6 py-4 space-y-3">
            <button
              type="button"
              onClick={clear}
              disabled={items.length === 0}
              className="w-full rounded-lg border border-border py-2 text-sm font-semibold text-text-secondary hover:bg-gray-100 disabled:opacity-50"
            >
              Limpar carrinho
            </button>
            <button
              type="button"
              onClick={checkout}
              disabled={items.length === 0}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Finalizar Matrícula
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}