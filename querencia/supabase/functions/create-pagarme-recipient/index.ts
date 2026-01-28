import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { bankData } = await req.json()
    const PAGARME_KEY = Deno.env.get('PAGARME_SECRET_KEY')

    // Pagar.me exige que o documento tenha apenas números e o banco tenha 3 dígitos
    const cleanDoc = bankData.document.replace(/\D/g, '')
    const isCompany = cleanDoc.length > 11
    const personType = isCompany ? 'company' : 'individual'

    const payload = {
      name: bankData.fullName,
      email: bankData.email || "contato@querenciahoops.com.br",
      document: cleanDoc,
      type: personType,
      default_bank_account: {
        holder_name: bankData.fullName,
        holder_type: personType,
        holder_document: cleanDoc,
        bank: bankData.bankCode.padStart(3, '0'),
        branch_number: bankData.branchNumber,
        account_number: bankData.accountNumber,
        account_check_digit: bankData.accountDigit,
        type: 'checking'
      },
      transfer_settings: {
        transfer_enabled: true,
        transfer_interval: 'Daily',
        transfer_day: 0
      }
    }

    const response = await fetch('https://api.pagar.me/core/v5/recipients', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAGARME_KEY + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok) {
      // Isso imprimirá o erro real nos Logs do Supabase
      console.error('ERRO PAGARME DETALHADO:', JSON.stringify(result))
      return new Response(JSON.stringify({ error: result }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})