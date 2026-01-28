/* eslint-disable @typescript-eslint/no-unused-vars */
// supabase/functions/process-pagarme-order/index.ts

// ✅ Agora usamos o mapeamento do deno.json
import { serve } from "std/http/server"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Tratamento de CORS para o Vite
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, items, splitRules } = await req.json()
    const API_KEY = Deno.env.get('PAGARME_SECRET_KEY')

    if (!API_KEY) throw new Error("Chave PAGARME_SECRET_KEY não configurada")

    // Sua lógica de integração aqui...

    return new Response(JSON.stringify({ message: "Sucesso" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    const errorMessage = typeof error === "object" && error !== null && "message" in error
      ? (error as { message: string }).message
      : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})