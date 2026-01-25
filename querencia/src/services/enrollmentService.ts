/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/enrollmentService.ts
import { supabase } from '../supabaseClient'

/**
 * Cria matrículas para múltiplos cursos, processando pagamentos e ganhos dos professores.
 * @param userId ID do aluno que está a realizar a compra.
 * @param items Lista de cursos (carrinho) com id, priceCents e teacherId.
 */
export async function createMultipleEnrollments(userId: string, items: any[]) {
  // Usamos um loop para processar cada item individualmente
  // Isso garante a integridade referencial para cada professor e curso
  for (const item of items) {
    try {
      // 1. Criar a matrícula para o curso específico
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

      // 2. Registrar o pagamento vinculado a ESTA matrícula específica
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          enrollment_id: enrollment.id,
          amount_cents: item.priceCents || 0,
          provider: 'MANUAL', // Define como MANUAL para processamento interno
          status: 'PAID'
        })

      if (paymentError) throw paymentError

      // 3. Lógica de Repasse: Registrar o ganho para o professor deste curso
      // Aqui garantimos que o valor seja destinado ao teacher_id correto do curso
      if (item.teacherId) {
        const platformFeePercent = 0.10 // Taxa da plataforma (ex: 10%)
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
    } catch (error) {
      console.error(`Erro ao processar curso ${item.id}:`, error)
      // Interrompe a execução para evitar que o aluno fique matriculado sem o registo financeiro correto
      throw error 
    }
  }
}