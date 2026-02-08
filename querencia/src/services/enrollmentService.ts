/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../supabaseClient'

export async function createCheckoutSession(userId: string, items: any[]) {
  // 1. Busca apenas nome e email do usuário (dados básicos do Auth)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Usuário não autenticado. Faça login novamente.')
  }

  // Calcula o total em centavos
  const totalAmount = items.reduce((acc, item) => acc + (item.priceCents || 0), 0)

  // 2. Envia apenas dados mínimos - Pagar.me coleta o resto no checkout
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(
    'https://akotfntkzzkjguhlumcb.supabase.co/functions/v1/create-payment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        amount: totalAmount,
        customer: {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente',
          email: user.email
        }
      })
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Erro ao processar checkout na Pagar.me')
  }

  return data.checkout_url
}