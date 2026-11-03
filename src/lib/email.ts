import { headers } from 'next/headers';

// Envio de e-mails pelo Resend. Enquanto RESEND_API_KEY e EMAIL_REMETENTE não estiverem
// cadastrados na Vercel, nada é enviado e a função devolve false (o site mostra o link para copiar).
export async function enviarEmail({ para, assunto, html, texto }: { para: string; assunto: string; html: string; texto: string }): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_REMETENTE;
  if (!chave || !de) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: [para], subject: assunto, html, text: texto }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Endereço do site a partir da própria requisição (funciona no vercel.app e no domínio próprio)
export async function enderecoDoSite(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) return `${h.get('x-forwarded-proto') ?? 'https'}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? '';
}
