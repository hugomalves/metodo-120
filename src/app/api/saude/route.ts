import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Diagnóstico da ligação com o Supabase (não mostra nenhuma chave, só se ela existe e o tipo)
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const tipo = chave.startsWith('sb_publishable_') ? 'publishable (nova)' : chave.startsWith('eyJ') ? 'anon (antiga)' : chave ? 'formato desconhecido' : 'vazia';
  const r: Record<string, unknown> = {
    endereco_supabase: url ? (/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ? 'ok' : `formato estranho: ${url.slice(0, 40)}`) : 'faltando',
    chave: tipo,
    espaco_na_chave: /\s/.test(chave) ? 'SIM (apague os espaços ou quebras de linha)' : 'não',
    endereco_do_site: process.env.NEXT_PUBLIC_SITE_URL ?? 'faltando',
  };
  if (url && chave) {
    try {
      const sb = createClient(url, chave.trim(), { auth: { persistSession: false } });
      const { data, error } = await sb.from('editais').select('nome, publicado');
      r.leitura_editais = error ? `ERRO: ${error.message}` : data;
    } catch (e) {
      r.leitura_editais = `ERRO: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  return NextResponse.json(r, { headers: { 'cache-control': 'no-store' } });
}
