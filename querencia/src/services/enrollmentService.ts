/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/enrollmentService.ts
import { supabase } from '../supabaseClient'

/**
 * Cria matrículas para os cursos no carrinho, processando pagamentos e ganhos dos professores.
 */
export async function createMultipleEnrollments(userId: string, items: any[]) {
  for (const item of items) {
    try {
      // 1. Criar a matrícula na tabela 'enrollments'
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: userId,
          course_id: item.id,
          price_paid_cents: item.priceCents || 0,
          status: 'ACTIVE'
        })
        .select()
        .single()

      if (enrollError) throw enrollError

      // 2. Registar o pagamento na tabela 'payments'
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          enrollment_id: enrollment.id,
          amount_cents: item.priceCents || 0,
          provider: 'MANUAL',
          status: 'PAID'
        })

      if (paymentError) throw paymentError

      // 3. Registar o ganho do professor na tabela 'teacher_earnings'
      if (item.teacherId) {
        const platformFeePercent = 0.05 // Taxa de 5% da plataforma
        const grossAmount = item.priceCents || 0
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
    } catch (error: any) {
      console.error(`Erro ao processar curso ${item.id}:`, error.message || error)
      throw error 
    }
  }
}