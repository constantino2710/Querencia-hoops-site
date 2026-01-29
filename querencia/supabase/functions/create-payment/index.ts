/* eslint-disable @typescript-eslint/no-explicit-any */
export const config = { auth: false }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  
  let currentEnrollmentId: string | null = null;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    
    const body = await req.json()
    currentEnrollmentId = body?.enrollment_id
    const { amount, customer, billingAddress } = body

    if (!currentEnrollmentId) {
      return new Response(JSON.stringify({ error: "enrollment_id é obrigatório" }), { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    const PAGARME_API_KEY = Deno.env.get("PAGARME_API_KEY")
    const authHeader = `Basic ${btoa(`${PAGARME_API_KEY}:`)}`

    // Requisição formatada com as configurações obrigatórias de Pix e Cartão
    const resp = await fetch(`https://api.pagar.me/core/v5/orders`, {
      method: "POST",
      headers: { 
        "Authorization": authHeader, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        customer: {
          name: customer.name,
          email: customer.email,
          document: customer.document.replace(/\D/g, ""),
          type: "individual",
          phones: {
            mobile_phone: {
              country_code: "55",
              area_code: customer.phones?.mobile_phone?.area_code || "81",
              number: customer.phones?.mobile_phone?.number || "999999999"
            }
          }
        },
        items: [{
          amount: amount,
          description: "Matrícula Querência Hoops",
          quantity: 1,
          code: "MATRICULA"
        }],
        payments: [{
          payment_method: "checkout",
          checkout: {
            expires_in: 120,
            billing_address_editable: true,
            customer_editable: false,
            accepted_payment_methods: ["credit_card", "pix"], // Pix está aqui, então precisa do objeto 'pix' abaixo
            success_url: "https://seusite.com/sucesso",
            skip_checkout_success_page: false,
            // Configurações de Cartão
            credit_card: {
              capture: true,
              statement_descriptor: "QUERENCIA",
              installments: [{
                number: 1,
                total: amount
              }]
            },
            // Configuração obrigatória do Pix (mesmo que você use depois)
            pix: {
              expires_in: 3600 // Expira em 1 hora
            },
            billing_address: {
              street: billingAddress?.street || "Rua",
              number: billingAddress?.number || "SN",
              neighborhood: billingAddress?.neighborhood || "Bairro",
              city: billingAddress?.city || "Cidade",
              state: billingAddress?.state || "PE",
              zip_code: (billingAddress?.zip_code || "00000000").replace(/\D/g, ""),
              country: "BR"
            }
          }
        }]
      }),
    })

    const order = await resp.json()

    if (!resp.ok) {
      await supabase.from("enrollments").update({ status: "CANCELED" }).eq("id", currentEnrollmentId)
      return new Response(JSON.stringify({ 
        error: "Falha Pagar.me", 
        motivo: order.message, 
        debug: order.errors 
      }), { status: 400, headers: corsHeaders })
    }

    await supabase.from("payments").upsert({
      enrollment_id: currentEnrollmentId,
      amount_cents: amount,
      provider: "PAGARME",
      status: "PENDING",
      order_id: order.id,
      payment_method: "checkout"
    }, { onConflict: "enrollment_id" })

    const checkoutUrl = order.checkouts?.[0]?.payment_url || order.payments?.[0]?.checkout?.payment_url;

    return new Response(JSON.stringify({ 
      checkout_url: checkoutUrl,
      order_id: order.id 
    }), { status: 200, headers: corsHeaders })

  } catch (e) {
    if (currentEnrollmentId) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
      await supabase.from("enrollments").update({ status: "CANCELED" }).eq("id", currentEnrollmentId)
    }
    return new Response(JSON.stringify({ error: "Erro interno", details: String(e) }), { status: 500, headers: corsHeaders })
  }
})