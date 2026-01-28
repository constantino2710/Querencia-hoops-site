import { supabase } from '../supabaseClient';

export interface TeacherBalance {
  available: number;
  waiting_funds: number;
  transferred: number;
}

/**
 * Busca o saldo do professor diretamente na Pagar.me
 */
export async function getTeacherBalance(teacherId: string): Promise<TeacherBalance | null> {
  // 1. Obtém o recipient_id do banco de dados
  const { data: user, error } = await supabase
    .from('users')
    .select('pagarme_recipient_id')
    .eq('id', teacherId)
    .single();

  if (error || !user?.pagarme_recipient_id) return null;

  try {
    // 2. Consulta a API da Pagar.me (Idealmente via Edge Function para esconder a API Key)
    const response = await fetch(`https://api.pagar.me/core/v5/recipients/${user.pagarme_recipient_id}/balances`, {
      headers: {
        'Authorization': `Basic ${btoa(import.meta.env.VITE_PAGARME_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return {
      available: data.available || 0,
      waiting_funds: data.waiting_funds || 0,
      transferred: data.transferred || 0
    };
  } catch (err) {
    console.error("Erro ao buscar saldo:", err);
    return null;
  }
}