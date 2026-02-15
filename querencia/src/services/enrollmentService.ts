/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../supabaseClient'

export async function createCheckoutSession(userId: string, items: any[]) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Usuário não autenticado. Faça login novamente.')
  }

  const enrollmentIds: string[] = []

  for (const item of items) {
    // Verifica se já existe enrollment cancelada para reutilizar
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', item.id)
      .eq('status', 'CANCELED')
      .single()

    let enrollment
    if (existing) {
      const { data, error } = await supabase
        .from('enrollments')
        .update({ price_paid_cents: item.priceCents || 0, enrolled_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('id')
        .single()
      if (error) throw new Error('Erro ao criar matrícula. Tente novamente.')
      enrollment = data
    } else {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: userId,
          course_id: item.id,
          price_paid_cents: item.priceCents || 0,
          status: 'CANCELED'
        })
        .select('id')
        .single()
      if (error) throw new Error('Erro ao criar matrícula. Tente novamente.')
      enrollment = data
    }

    enrollmentIds.push(enrollment.id)
  }

  const totalAmount = items.reduce((acc, item) => acc + (item.priceCents || 0), 0)

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
    for (const enrollmentId of enrollmentIds) {
      await supabase
        .from('enrollments')
        .update({ status: 'CANCELED' })
        .eq('id', enrollmentId)
    }

    throw new Error(data.message || data.error || 'Erro ao processar checkout na Pagar.me')
  }

  return data.checkout_url
}
