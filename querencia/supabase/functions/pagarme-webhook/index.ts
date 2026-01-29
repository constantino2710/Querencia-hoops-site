/* eslint-disable @typescript-eslint/no-unused-vars */
export const config = { auth: false }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const payload = await req.json()
    
    const orderId = payload?.data?.id || payload?.data?.order?.id
    const rawStatus = (payload?.data?.status || payload?.data?.order?.status)?.toLowerCase()

    if (!orderId) return new Response("OK", { status: 200 })

    let dbStatus = "PENDING"
    if (["paid", "captured"].includes(rawStatus)) dbStatus = "PAID"
    if (["failed", "canceled"].includes(rawStatus)) dbStatus = "FAILED"

    // 1. Atualizar o status do pagamento no banco
    const { data: payment, error } = await supabase
      .from("payments")
      .update({ status: dbStatus })
      .eq("order_id", orderId)
      .select("enrollment_id")
      .single()

    // 2. Se o status virou PAID (Pix pago), ativa a matrícula
    if (payment?.enrollment_id && dbStatus === "PAID") {
      await supabase.from("enrollments").update({ status: "ACTIVE" }).eq("id", payment.enrollment_id)
    }

    return new Response("OK", { status: 200 })
  } catch (e) {
    console.error("Webhook Error:", e)
    return new Response("Error", { status: 500 })
  }
})