import { NextResponse, type NextRequest } from 'next/server';
import { createClient as criarAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { SUPABASE_URL } from '@/lib/supabase/env';
import { aplicarMarcaDagua } from '@/lib/marcaDagua';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Entrega o PDF do produto com a marca d'água de quem comprou. O arquivo original fica numa pasta que o aluno não acessa.
export async function GET(request: NextRequest, { params }: { params: Promise<{ produtoId: string }> }) {
  const { produtoId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(produtoId)) return NextResponse.json({ erro: 'material não encontrado' }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(new URL('/entrar', request.url));

  const { data: pode } = await supabase.rpc('pode_baixar_pdf', { p_produto: produtoId });
  if (!pode) return NextResponse.json({ erro: 'Você não tem acesso a este material.' }, { status: 403 });

  const { data: dados } = await supabase.from('dados_comprador').select('nome, cpf, telefone').eq('email', user.email.toLowerCase()).maybeSingle();
  if (!dados) return NextResponse.redirect(new URL(`/aluno/material/${produtoId}`, request.url));

  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) return NextResponse.json({ erro: 'entrega não configurada' }, { status: 503 });
  const admin = criarAdmin(SUPABASE_URL, chave, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: reg } = await admin.from('produto_pdfs').select('pdf_path, nome_arquivo').eq('produto_id', produtoId).maybeSingle();
  if (!reg) return NextResponse.json({ erro: 'material não encontrado' }, { status: 404 });
  const { data: arquivo, error } = await admin.storage.from('produtos-pdf').download(reg.pdf_path as string);
  if (error || !arquivo) return NextResponse.json({ erro: 'não foi possível abrir o arquivo' }, { status: 500 });

  let saida: Uint8Array;
  try {
    saida = await aplicarMarcaDagua(new Uint8Array(await arquivo.arrayBuffer()), dados as { nome: string; cpf: string; telefone: string });
  } catch {
    return NextResponse.json({ erro: 'não foi possível preparar o PDF' }, { status: 500 });
  }

  const nome = String(reg.nome_arquivo ?? 'material').replace(/\.pdf$/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').slice(0, 80) || 'material';
  // entrega em pedaços (respostas grandes passam melhor assim na hospedagem)
  const pedaco = 64 * 1024;
  let pos = 0;
  const corpo = new ReadableStream<Uint8Array>({
    pull(controle) {
      if (pos >= saida.length) { controle.close(); return; }
      controle.enqueue(saida.subarray(pos, pos + pedaco));
      pos += pedaco;
    },
  });
  return new Response(corpo, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(saida.length),
      'Content-Disposition': `inline; filename="${nome}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
