// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { type, data } = body

    // Verifica se o pagamento foi pago com sucesso
    if (type === 'order.paid') {
      const orderId = data.id
      
      // 1. Atualiza o status do pagamento no seu banco
      const { data: payment, error: pError } = await supabase
        .from('payments')
        .update({ status: 'PAID', paid_at: new Date().toISOString() })
        .eq('provider_payment_id', orderId)
        .select()
        .single()

      if (pError) throw pError

      // 2. Ativa a matrícula do aluno
      await supabase
        .from('enrollments')
        .update({ status: 'ACTIVE' })
        .eq('id', payment.enrollment_id)
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 })
  }
})