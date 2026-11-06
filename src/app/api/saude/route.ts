import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

// Verificação rápida: o site consegue ler o banco de dados? (não mostra chaves nem dados)
export async function GET() {
  let banco = 'ok';
  if (!SUPABASE_URL || !SUPABASE_KEY) banco = 'erro: falta o endereço ou a chave do Supabase na Vercel';
  else {
    try {
      const { error } = await createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }).from('editais').select('id').limit(1);
      if (error) banco = `erro: ${error.message}`;
    } catch (e) {
      banco = `erro: ${e instanceof Error ? e.message : 'falha na ligação'}`;
    }
  }
  return NextResponse.json({ site: 'ok', banco }, { status: banco === 'ok' ? 200 : 503, headers: { 'cache-control': 'no-store' } });
}
