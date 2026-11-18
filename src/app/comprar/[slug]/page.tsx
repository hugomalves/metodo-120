import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Cabecalho } from '@/components/Cabecalho';
import { createClient } from '@/lib/supabase/server';
import styles from './comprar.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Finalizar compra' };

// Passo do site para quem já está logado: explica o pagamento e leva à Kiwify com o e-mail da conta preenchido.
// (O acesso é liberado pelo e-mail da compra: ele precisa ser o mesmo da conta.)
export default async function Comprar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data } = await supabase.from('produtos').select('slug, nome, preco, checkout_url, venda_aberta, gratuito').eq('slug', slug).maybeSingle();
  const p = data as { slug: string; nome: string; preco: string | null; checkout_url: string | null; venda_aberta: boolean; gratuito: boolean } | null;
  if (!p || !p.venda_aberta) notFound();
  if (p.gratuito) redirect('/aluno');

  let destino: string | null = null;
  if (p.checkout_url) {
    const u = new URL(p.checkout_url);
    if (user.email) u.searchParams.set('email', user.email);
    const nome = String(user.user_metadata?.nome ?? '').trim();
    if (nome) u.searchParams.set('name', nome);
    destino = u.toString();
  }

  return (
    <div className="tema-site">
      <Cabecalho />
      <main className={`container ${styles.pagina}`}>
        <span className="rotulo">Finalizar compra</span>
        <h1 className="display">{p.nome}</h1>
        {p.preco && <b className={styles.preco}>{p.preco}</b>}
        <ol className={styles.passos}>
          <li><b>Pagamento seguro na Kiwify.</b> O pagamento é feito na página da Kiwify, que abre em outra aba. O Método 120 não guarda dados do seu cartão.</li>
          <li><b>Use o mesmo e-mail da sua conta:</b> <span className={styles.email}>{user.email}</span>. É por ele que o acesso é liberado.</li>
          <li><b>Acesso automático.</b> Em poucos instantes depois do pagamento, o curso aparece na sua área. Se não aparecer, atualize a página.</li>
        </ol>
        <div className={styles.acoes}>
          {destino
            ? <a href={destino} target="_blank" rel="noopener" className="btn btn-azul btn-grande">Ir para o pagamento →</a>
            : <span className="suave">As vendas deste curso abrem em breve.</span>}
          <Link href="/aluno" className="btn btn-linha btn-grande">Voltar para a minha área</Link>
        </div>
      </main>
    </div>
  );
}
