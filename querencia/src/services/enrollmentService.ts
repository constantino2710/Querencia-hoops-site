/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../supabaseClient';
import type { Database } from '../database.types';

// Tipagens extraídas do seu schema do Supabase
type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

interface CartItem {
  id: string;
  title: string;
  priceCents: number;
  teacherId: string;
}

export async function processEnrollmentCheckout(userId: string, items: CartItem[]) {
  try {
    // 1. Procurar os IDs de recebedor dos professores no banco
    const teacherIds = items.map(item => item.teacherId).filter(Boolean);
    const { data: teachers, error: tError } = await supabase
      .from('users')
      .select('id, pagarme_recipient_id')
      .in('id', teacherIds);

    if (tError) throw tError;

    // 2. Criar as matrículas iniciais (status vem da sua migração)
    const enrollmentsToCreate: EnrollmentInsert[] = items.map(item => ({
      student_id: userId,
      course_id: item.id,
      price_paid_cents: item.priceCents || 0,
      status: 'CANCELED' // Aguarda o webhook para ativar
    }));

    const { data: createdEnrollments, error: enrollError } = await supabase
      .from('enrollments')
      .insert(enrollmentsToCreate)
      .select();

    if (enrollError || !createdEnrollments) throw enrollError;

    // 3. Preparar regras de Split
    const splitRules: any[] = [];
    const platformFeePercent = 0.05;

    items.forEach(item => {
      const teacher = teachers?.find(t => t.id === item.teacherId);
      const grossAmount = item.priceCents || 0;
      const feeAmount = Math.round(grossAmount * platformFeePercent);
      const netAmount = grossAmount - feeAmount;

      if (teacher?.pagarme_recipient_id) {
        splitRules.push({
          recipient_id: teacher.pagarme_recipient_id,
          amount: netAmount,
          type: 'flat',
          options: { charge_processing_fee: true, liable: true }
        });
        splitRules.push({
          recipient_id: import.meta.env.VITE_PLATFORM_RECIPIENT_ID,
          amount: feeAmount,
          type: 'flat',
          options: { charge_processing_fee: false, liable: false }
        });
      }
    });

    // 4. Invocar a Edge Function (Segurança)
    const { data: pagarmeOrder, error: functionError } = await supabase.functions.invoke('process-pagarme-order', {
      body: { userId, items, splitRules }
    });

    if (functionError) throw functionError;

    // 5. Registar os pagamentos (Correção do erro de Overload e Enum)
    const paymentsToCreate: PaymentInsert[] = createdEnrollments.map((enroll, index) => ({
      enrollment_id: enroll.id,
      amount_cents: items[index].priceCents,
      provider: 'PAGARME',
      provider_payment_id: String(pagarmeOrder.id),
      status: 'PENDING' // Tipado corretamente via PaymentInsert
    }));

    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentsToCreate);

    if (paymentError) throw paymentError;

    return pagarmeOrder;

  } catch (error: any) {
    console.error("Erro no checkout:", error.message);
    throw error;
  }
}