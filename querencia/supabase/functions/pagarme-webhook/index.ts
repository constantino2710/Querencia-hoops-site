import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const payload = await req.json()
    
    // Extrai o ID da ordem e o status
    const orderId = payload?.data?.id || payload?.data?.order?.id
    const rawStatus = (payload?.data?.status || payload?.data?.order?.status)?.toLowerCase()

    if (!orderId) return new Response("Sem ID de Ordem", { status: 200 })

    let dbStatus = "PENDING"
    if (["paid", "captured"].includes(rawStatus)) dbStatus = "PAID"
    if (["failed", "canceled"].includes(rawStatus)) dbStatus = "FAILED"

    // 1. Atualizar o status do pagamento usando o order_id salvo anteriormente
    const { data: payment, error } = await supabase
      .from("payments")
      .update({ status: dbStatus })
      .eq("order_id", orderId)
      .select("enrollment_id")
      .single()

    if (error) {
      console.error("Pagamento não encontrado no banco:", orderId)
      return new Response("Pagamento não encontrado", { status: 200 })
    }

    // 2. Se o status for PAID, ativa a matrícula do estudante
    if (payment?.enrollment_id && dbStatus === "PAID") {
      await supabase
        .from("enrollments")
        .update({ status: "ACTIVE" }) // Isso "atrela" o curso ao aluno
        .eq("id", payment.enrollment_id)
      
      console.log(`Matrícula ${payment.enrollment_id} ativada com sucesso!`)
    }

    return new Response("OK", { status: 200 })
  } catch (e) {
    console.error("Erro no Webhook:", e)
    return new Response("Erro interno", { status: 500 })
  }
})