import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { createClient } from '@/lib/supabase/server';
import { REDES } from '@/lib/marca';

type Edital = { id: string; nome: string; situacao: string; data_prova: string | null };

async function dadosDoTopo(): Promise<{ editais: Edital[]; oferta: string; logado: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data }, { data: prods }] = await Promise.all([
      supabase.from('editais').select('id, nome, situacao, data_prova').eq('publicado', true).order('data_prova', { nullsFirst: false }),
      supabase.from('produtos').select('slug, destaque, ordem').eq('venda_aberta', true).eq('tipo', 'curso').not('slug', 'like', 'plano-%').order('ordem'),
    ]);
    const lista = (prods ?? []) as { slug: string; destaque: boolean }[];
    // a oferta é o curso em destaque à venda (ex.: Reta Final); sem destaque, a loja
    const destaque = lista.find((p) => p.destaque) ?? null;
    return { editais: (data ?? []) as Edital[], oferta: destaque ? `/curso/${destaque.slug}` : '/loja', logado: !!user };
  } catch {
    return { editais: [], oferta: '/loja', logado: false };
  }
}

const ICONE: Record<string, string> = {
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01',
  youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z',
  whatsapp: 'M4 20l1.3-3.9A8 8 0 1 1 8 19zM9 8.5c0 3 2.5 6.5 6 7l1.2-1.6-2-1-1 .9c-1.2-.5-2.3-1.6-2.8-2.8l.9-1-1-2z',
};

// Cabeçalho das páginas abertas: faixa de aviso + uma barra só, com
// logo · abas (Loja, Editais, Notícias, Planos, Oferta) · Entrar e Garantir vaga.
// No celular, as abas descem para uma segunda linha que rola para o lado; Entrar e Garantir vaga ficam sempre à vista.
export async function Cabecalho() {
  const { editais, oferta, logado } = await dadosDoTopo();
  const aberto = editais.find((e) => e.situacao === 'aberto');
  const redes = Object.entries(REDES).filter(([, url]) => url);
  const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

  const abas = (
    <nav className="cab-abas" aria-label="Menu principal">
      <Link href="/loja">Loja</Link>
      <details className="cab-drop">
        <summary>Editais</summary>
        <div className="cab-drop-lista">
          {editais.map((e) => (
            <Link key={e.id} href="/#editais">{e.nome}<small>{e.situacao === 'aberto' ? 'Edital aberto' : e.situacao === 'previsto' ? 'Previsto' : 'Encerrado'}</small></Link>
          ))}
          <Link href="/#editais" className="cab-drop-todos">Ver todos os editais</Link>
        </div>
      </details>
      <Link href="/noticias">Notícias</Link>
      <Link href="/planos">Planos</Link>
      <Link href={oferta} className="cab-oferta">Oferta</Link>
    </nav>
  );

  return (
    <header className="cab">
      {aberto && (
        <Link href="/#editais" className="cab-aviso">
          <b>Edital aberto:</b> {aberto.nome}{aberto.data_prova ? ` · prova em ${dataBr(aberto.data_prova)}` : ''} <span>Treinar agora →</span>
        </Link>
      )}
      <div className="cab-barra">
        <div className="container cab-linha">
          <Marca tamanho={30} />
          <div className="cab-abas-largo">{abas}</div>
          {redes.length > 0 && (
            <span className="cab-redes">
              {redes.map(([nome, url]) => (
                <a key={nome} href={url} target="_blank" rel="noopener" aria-label={nome}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONE[nome]} /></svg>
                </a>
              ))}
            </span>
          )}
          <div className="cab-conta">
            <Link href={logado ? '/aluno' : '/entrar'} className="cab-entrar">{logado ? 'Minha área' : 'Login'}</Link>
            <Link href={oferta} className="cab-garantir">Garantir vaga</Link>
          </div>
        </div>
        <div className="cab-abas-estreito">{abas}</div>
      </div>
    </header>
  );
}
