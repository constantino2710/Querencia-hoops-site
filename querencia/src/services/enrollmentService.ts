/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../supabaseClient'

export async function createCheckoutSession(userId: string, items: any[]) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada. Faça login novamente.");

    const { data: profile } = await supabase
      .from('users')
      .select('name, email') 
      .eq('id', userId)
      .single();

    const totalCents = items.reduce((acc, curr) => acc + (curr.priceCents || 0), 0);

    // Chama a Edge Function 'create-payment'
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        enrollment_id: crypto.randomUUID(),
        amount: totalCents,
        customer: {
          name: profile?.name || 'Estudante',
          email: profile?.email || session.user.email,
          document: '00000000000' 
        }
      })
    });

    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro no servidor de pagamento");
    }

    const result = await response.json();
    return result.checkout_url;
  } catch (err: any) {
    throw new Error(err.message);
  }
}