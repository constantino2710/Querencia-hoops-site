/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
    const { amount, customer } = body

    const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY')
    const authHeader = `Basic ${btoa(`${PAGARME_API_KEY}:`)}`

    // ✅ Payload simplificado - Pagar.me coleta CPF e endereço no checkout
    const payload = {
      items: [{ 
        amount, 
        description: "Matrícula Querência Hoops", 
        quantity: 1, 
        code: "MATRICULA" 
      }],
      customer: {
        name: customer.name,
        email: customer.email
      },
      payments: [{
        payment_method: "checkout",
        checkout: {
          expires_in: 3600, // 1 hora para completar
          accepted_payment_methods: ["credit_card", "pix"],
          success_url: "https://zooanalisesvet.com.br/student/dashboard",
          skip_checkout_success_page: false,
          customer_editable: true, // ✅ Permite editar dados no checkout
          billing_address_editable: true, // ✅ Permite preencher endereço
          pix: { 
            expires_in: 3600 
          }
        }
      }]
    }

    console.log("🚀 Enviando para Pagar.me:", JSON.stringify(payload, null, 2))

    // Chamada para a API da Pagar.me v5
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
      console.error("❌ Erro Pagar.me:", order)
      return new Response(JSON.stringify({ 
        error: "Falha no Gateway", 
        message: order.message,
        details: order.errors 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Extrai a URL de checkout da resposta da Pagar.me
    const checkoutUrl = order.checkouts?.[0]?.payment_url

    console.log("✅ Checkout criado:", checkoutUrl)

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("💥 Erro geral:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})