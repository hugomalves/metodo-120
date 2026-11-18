import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Lista de leads em CSV (só o professor)
export async function GET() {
  const supabase = await createClient();
  const { data: ok } = await supabase.rpc('eh_professor');
  if (!ok) return NextResponse.json({ erro: 'não autorizado' }, { status: 403 });
  const { data } = await supabase.from('dados_comprador').select('nome, email, telefone, cpf, origem, atualizado_em').order('atualizado_em', { ascending: false });
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Nome', 'E-mail', 'Telefone', 'CPF', 'Origem', 'Data'].join(';')].concat(
    ((data ?? []) as Record<string, string>[]).map((x) => [x.nome, x.email, x.telefone, x.cpf, x.origem === 'kiwify' ? 'Compra' : 'Cadastro', x.atualizado_em.slice(0, 10)].map(esc).join(';')));
  return new Response('﻿' + linhas.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="leads-metodo120.csv"' } });
}
