/* eslint-disable @typescript-eslint/no-explicit-any */
// supabase/functions/create-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Log inicial para saber que a função foi chamada
  console.log(`Recebida requisição: ${req.method}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    console.log("Corpo da requisição recebido:", JSON.stringify(body, null, 2));

    const { enrollment_id, amount, customer } = body

    const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY')
    if (!PAGARME_API_KEY) {
      console.error("ERRO: Variável de ambiente PAGARME_API_KEY não configurada no Supabase.");
      throw new Error("Configuração do servidor incompleta (API Key).");
    }

    const authHeader = `Basic ${btoa(`${PAGARME_API_KEY}:`)}`

    console.log("Enviando requisição para Pagar.me...");
    
    const resp = await fetch(`https://api.pagar.me/core/v5/orders`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: customer.name,
          email: customer.email,
          document: customer.document.replace(/\D/g, ""),
          type: "individual",
          phones: { 
            mobile_phone: { country_code: "55", area_code: "81", number: "999999999" } 
          }
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
            expires_in: 120,
            accepted_payment_methods: ["credit_card", "pix"],
            success_url: "http://localhost:5173/student/dashboard",
            pix: { expires_in: 3600 },
            billing_address: {
              street: "Rua", number: "123", neighborhood: "Bairro",
              city: "Cidade", state: "PE", zip_code: "51000000", country: "BR"
            }
          }
        }]
      })
    })

    const order = await resp.json()

    if (!resp.ok) {
        console.error("ERRO Pagar.me detectado:", JSON.stringify(order, null, 2));
        
        // Tenta cancelar a matrícula se houver ID
        if (enrollment_id) {
            await supabase.from("enrollments").update({ status: "CANCELED" }).eq("id", enrollment_id)
            console.log(`Matrícula ${enrollment_id} marcada como CANCELED devido a erro no gateway.`);
        }

        return new Response(JSON.stringify({ 
            error: "Falha na Pagar.me", 
            message: order.message,
            details: order.errors 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }

    console.log("Sucesso! Ordem gerada na Pagar.me:", order.id);
    
    const checkoutUrl = order.checkouts?.[0]?.payment_url || order.payments?.[0]?.checkout?.payment_url;
    
    if (!checkoutUrl) {
        console.warn("Aviso: Checkout URL não encontrada na resposta da Pagar.me.");
    }

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("ERRO CRÍTICO na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: "Erro interno no servidor", message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})