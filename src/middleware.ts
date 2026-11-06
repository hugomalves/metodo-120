import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Se a ligação com o Supabase falhar (variável faltando ou com valor errado), o site não cai:
// a página abre e o /api/saude mostra o que está errado.
export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (e) {
    console.error('middleware: falha ao ligar no Supabase', e);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)'],
};
