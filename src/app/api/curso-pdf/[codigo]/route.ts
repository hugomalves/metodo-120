import { NextResponse, type NextRequest } from 'next/server';
import { createClient as criarAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { SUPABASE_URL } from '@/lib/supabase/env';
import { aplicarMarcaDagua } from '@/lib/marcaDagua';
import { CURSO } from '@/lib/planoCurso';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// PDF de uma aula ou bloco do curso (ex.: /api/curso-pdf/PT-AULA01-B2), com a marca d'água de quem abre
export async function GET(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const codigo = decodeURIComponent((await params).codigo).toUpperCase();
  if (!/^[A-Z]{2}-(AULA\d{2}|PROP\d)(-B\d+)?$/.test(codigo)) return NextResponse.json({ erro: 'PDF não encontrado' }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(new URL(`/entrar?voltar=${encodeURIComponent(`/api/curso-pdf/${codigo}`)}`, request.url));

  const { data: tem } = await supabase.rpc('tem_curso', { p_slug: CURSO });
  if (!tem) return NextResponse.redirect(new URL('/curso/reta-final-pmpe', request.url));

  const { data: dados } = await supabase.from('dados_comprador').select('nome, cpf, telefone').eq('email', user.email.toLowerCase()).maybeSingle();
  if (!dados) return NextResponse.redirect(new URL(`/aluno/seus-dados?voltar=${encodeURIComponent('/aluno/cronograma/reta-final')}`, request.url));

  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) return NextResponse.json({ erro: 'entrega não configurada' }, { status: 503 });
  const admin = criarAdmin(SUPABASE_URL, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: reg } = await admin.from('pdfs_curso').select('caminho').eq('produto_slug', CURSO).eq('codigo', codigo).maybeSingle();
  if (!reg) return NextResponse.json({ erro: 'Este PDF ainda não foi publicado.' }, { status: 404 });
  const { data: arquivo, error } = await admin.storage.from('produtos-pdf').download((reg as { caminho: string }).caminho);
  if (error || !arquivo) return NextResponse.json({ erro: 'não foi possível abrir o arquivo' }, { status: 500 });

  let saida: Uint8Array;
  try {
    saida = await aplicarMarcaDagua(new Uint8Array(await arquivo.arrayBuffer()), dados as { nome: string; cpf: string; telefone: string });
  } catch {
    return NextResponse.json({ erro: 'não foi possível preparar o PDF' }, { status: 500 });
  }
  return new Response(new Blob([saida as BlobPart]), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(saida.length),
      'Content-Disposition': `inline; filename="${codigo}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
