import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { atualizarNoticias } from '@/lib/noticiasConcursos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Busca automática de notícias de concurso, de 2 em 2 dias (agendada em vercel.json).
// Variáveis na Vercel: CRON_SECRET (qualquer texto longo; a Vercel envia como Bearer) e SUPABASE_SERVICE_ROLE_KEY.
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) return NextResponse.json({ erro: 'não autorizado' }, { status: 401 });
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!chave || !url) return NextResponse.json({ erro: 'faltam variáveis do Supabase' }, { status: 500 });
  const admin = createClient(url, chave, { auth: { persistSession: false } });
  const r = await atualizarNoticias(admin);
  revalidatePath('/noticias', 'layout');
  return NextResponse.json(r);
}
