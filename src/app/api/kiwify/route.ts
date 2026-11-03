import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Recebe os avisos da Kiwify (compra aprovada, reembolso, chargeback) e libera ou encerra o acesso.
// Variáveis necessárias na Vercel: SUPABASE_SERVICE_ROLE_KEY e KIWIFY_TOKEN.

type Payload = {
  order_id?: string;
  order_status?: string;
  webhook_event_type?: string;
  Customer?: { email?: string };
  Product?: { product_id?: string };
};

function assinaturaValida(corpo: string, assinatura: string | null, token: string): boolean {
  if (!assinatura) return false;
  const esperada = createHmac('sha1', token).update(corpo).digest('hex');
  const a = Buffer.from(esperada);
  const b = Buffer.from(assinatura);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const token = process.env.KIWIFY_TOKEN;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !chave) return NextResponse.json({ erro: 'integração não configurada' }, { status: 503 });

  const corpo = await request.text();
  let dados: Payload;
  try {
    dados = JSON.parse(corpo) as Payload;
  } catch {
    return NextResponse.json({ erro: 'corpo inválido' }, { status: 400 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const order = String(dados.order_id ?? '');
  const evento = String(dados.webhook_event_type ?? dados.order_status ?? '');
  const email = String(dados.Customer?.email ?? '');
  const produto = String(dados.Product?.product_id ?? '');

  // guarda só o necessário (minimização de dados): nada de CPF, telefone ou endereço do comprador
  const registrar = (resultado: string) =>
    admin.from('eventos_kiwify').insert({
      order_id: order,
      evento,
      email,
      produto_kiwify: produto,
      payload: { order_status: dados.order_status ?? null, webhook_event_type: dados.webhook_event_type ?? null },
      resultado,
    });

  if (!assinaturaValida(corpo, request.nextUrl.searchParams.get('signature'), token)) {
    await registrar('assinatura inválida');
    return NextResponse.json({ erro: 'assinatura inválida' }, { status: 401 });
  }

  const status = String(dados.order_status ?? '').toLowerCase();
  const tipo = String(dados.webhook_event_type ?? '').toLowerCase();
  let resultado = 'ignorado';

  if (status === 'paid' || tipo === 'order_approved' || tipo === 'compra_aprovada') {
    const { data, error } = await admin.rpc('kiwify_compra_aprovada', { p_email: email, p_produto_kiwify: produto, p_order: order });
    resultado = error ? `erro: ${error.message}` : String(data);
  } else if (status === 'refunded' || tipo === 'order_refunded' || tipo === 'compra_reembolsada') {
    const { data, error } = await admin.rpc('kiwify_compra_cancelada', { p_order: order, p_status: 'reembolsada' });
    resultado = error ? `erro: ${error.message}` : String(data);
  } else if (status === 'chargedback' || tipo === 'chargeback') {
    const { data, error } = await admin.rpc('kiwify_compra_cancelada', { p_order: order, p_status: 'cancelada' });
    resultado = error ? `erro: ${error.message}` : String(data);
  }

  await registrar(resultado);
  return NextResponse.json({ ok: true, resultado });
}
