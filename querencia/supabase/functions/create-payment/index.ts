/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { enrollment_ids, amount, customer } = body

    console.log("📦 Payload recebido:", JSON.stringify(body, null, 2))

    // Validações
    if (!enrollment_ids || enrollment_ids.length === 0) {
      throw new Error("enrollment_ids é obrigatório")
    }

    if (!amount || amount <= 0) {
      throw new Error("amount deve ser maior que zero")
    }

    if (!customer?.email) {
      throw new Error("email do cliente é obrigatório")
    }

    const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY')
    
    if (!PAGARME_API_KEY) {
      throw new Error("PAGARME_API_KEY não configurada")
    }

    const authHeader = `Basic ${btoa(`${PAGARME_API_KEY}:`)}`
    
    // Payload simplificado - Pagar.me coleta CPF e endereço no checkout
    const payload = {
      customer: {
        name: customer.name,
        email: customer.email
      },
      items: [{ 
        amount, 
        description: "Matrícula Querência Hoops", 
        quantity: 1, 
        code: "MATRICULA" 
      }],
      payments: [{
        payment_method: "checkout",
        checkout: {
          expires_in: 3600,
          accepted_payment_methods: ["credit_card", "pix"],
          success_url: "http://localhost:5173/student/dashboard",
          skip_checkout_success_page: false,
          customer_editable: true,
          billing_address_editable: true,
          pix: { expires_in: 3600 }
        }
      }]
    }

    console.log("🚀 Enviando para Pagar.me:", JSON.stringify(payload, null, 2))

    // Criar Ordem na Pagar.me
    const resp = await fetch(`https://api.pagar.me/core/v5/orders`, {
      method: 'POST',
      headers: { 
        'Authorization': authHeader, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    })

    const order = await resp.json()

    if (!resp.ok) {
      console.error("❌ Erro Pagar.me:", JSON.stringify(order, null, 2))
      
      // Cancela as enrollments se falhar
      console.log("🔄 Cancelando enrollments...")
      for (const enrollmentId of enrollment_ids) {
        await supabase
          .from('enrollments')
          .update({ status: 'CANCELED' })
          .eq('id', enrollmentId)
      }
      
      return new Response(JSON.stringify({ 
        error: "Falha na Pagar.me", 
        message: order.message || "Erro desconhecido",
        details: order.errors 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      })
    }

    console.log("✅ Order criada na Pagar.me:", order.id)

    // Salvar o vínculo na tabela payments para cada enrollment
    console.log("💾 Salvando payments no banco de dados...")
    
    for (const enrollmentId of enrollment_ids) {
      const { error: dbError } = await supabase
        .from("payments")
        .insert({
          enrollment_id: enrollmentId,
          amount_cents: amount,
          provider: 'PAGARME',
          order_id: order.id,
          status: 'PENDING'
        })

      if (dbError) {
        console.error("❌ Erro ao salvar payment:", dbError)
        throw dbError
      }
      
      console.log(`✅ Payment salvo para enrollment ${enrollmentId}`)
    }

    // Extrair URL do checkout
    const checkoutUrl = order.checkouts?.[0]?.payment_url

    if (!checkoutUrl) {
      console.error("❌ Checkout URL não encontrada na resposta:", order)
      throw new Error("URL de checkout não disponível")
    }

    console.log("✅ Checkout URL gerada:", checkoutUrl)

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("💥 Erro geral:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    })
  }
})