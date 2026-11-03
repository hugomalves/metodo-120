import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AREAS_LOGADAS = ['/aluno', '/boas-vindas', '/professor'];

// Renova a sessão a cada visita e protege as áreas que exigem login
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  let destino: string | null = null;

  if (!user && AREAS_LOGADAS.some((p) => path === p || path.startsWith(p + '/'))) {
    destino = '/entrar';
  } else if (user && (path === '/' || path === '/entrar')) {
    // quem já está logado cai direto na própria área
    destino = '/aluno';
  }

  if (destino) {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
