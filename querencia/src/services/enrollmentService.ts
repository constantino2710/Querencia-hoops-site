/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../supabaseClient'

export async function createCheckoutSession(userId: string, items: any[]) {
  // 1. Busca dados do usuário autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Usuário não autenticado. Faça login novamente.')
  }

  console.log('👤 Usuário autenticado:', user.email)

  // 2. Criar as enrollments no banco de dados com status PENDING
  const enrollmentIds: string[] = []
  
  for (const item of items) {
    console.log(`📝 Criando enrollment para curso ${item.id}`)
    
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        course_id: item.id,
        price_paid_cents: item.priceCents || 0,
        status: 'CANCELED' // Será mudada para ACTIVE quando o pagamento for confirmado
      })
      .select('id')
      .single()

    if (enrollError) {
      console.error('❌ Erro ao criar enrollment:', enrollError)
      throw new Error('Erro ao criar matrícula. Tente novamente.')
    }

    enrollmentIds.push(enrollment.id)
    console.log(`✅ Enrollment criada: ${enrollment.id}`)
  }

  console.log('✅ Total de enrollments criadas:', enrollmentIds.length)

  // 3. Calcula o total em centavos
  const totalAmount = items.reduce((acc, item) => acc + (item.priceCents || 0), 0)
  console.log(`💰 Valor total: ${totalAmount} centavos`)

  // 4. Envia para a Edge Function com os enrollment_ids
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('🚀 Enviando para Edge Function create-payment...')
  
  const response = await fetch(
    'https://akotfntkzzkjguhlumcb.supabase.co/functions/v1/create-payment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        enrollment_ids: enrollmentIds,
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
    console.error('❌ Erro na Edge Function:', data)
    
    // Se falhar, cancela as enrollments criadas
    console.log('🔄 Cancelando enrollments criadas...')
    for (const enrollmentId of enrollmentIds) {
      await supabase
        .from('enrollments')
        .update({ status: 'CANCELED' })
        .eq('id', enrollmentId)
    }
    
    throw new Error(data.message || data.error || 'Erro ao processar checkout na Pagar.me')
  }

  console.log('✅ Checkout URL recebida da Edge Function')
  return data.checkout_url
}