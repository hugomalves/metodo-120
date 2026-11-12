import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { createClient } from '@/lib/supabase/server';
import { REDES } from '@/lib/marca';

type Edital = { id: string; nome: string; situacao: string; data_prova: string | null };

async function editaisPublicados(): Promise<Edital[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('editais').select('id, nome, situacao, data_prova').eq('publicado', true).order('data_prova', { nullsFirst: false });
    return (data ?? []) as Edital[];
  } catch {
    return [];
  }
}

const ICONE: Record<string, string> = {
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01',
  youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z',
  whatsapp: 'M4 20l1.3-3.9A8 8 0 1 1 8 19zM9 8.5c0 3 2.5 6.5 6 7l1.2-1.6-2-1-1 .9c-1.2-.5-2.3-1.6-2.8-2.8l.9-1-1-2z',
};

// Cabeçalho das páginas abertas (vitrine, como funciona, entrar):
// faixa de aviso · barra navy com logo, menu e conta · barra clara com atalhos
export async function Cabecalho() {
  const editais = await editaisPublicados();
  const aberto = editais.find((e) => e.situacao === 'aberto');
  const redes = Object.entries(REDES).filter(([, url]) => url);
  const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

  const menu = (
    <>
      <details className="cab-drop">
        <summary>Concursos</summary>
        <div className="cab-drop-lista">
          {editais.map((e) => (
            <Link key={e.id} href="/#editais">{e.nome}<small>{e.situacao === 'aberto' ? 'Edital aberto' : e.situacao === 'previsto' ? 'Previsto' : 'Encerrado'}</small></Link>
          ))}
          <Link href="/#editais" className="cab-drop-todos">Ver todos os editais</Link>
        </div>
      </details>
      <Link href="/loja" className="cab-loja">Loja</Link>
      <Link href="/como-funciona">Como funciona</Link>
      <Link href="/#banco">Questões grátis</Link>
      <Link href="/como-funciona#teste">Minissimulado</Link>
    </>
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
          <nav className="cab-menu" aria-label="Menu principal">{menu}</nav>
          <div className="cab-conta">
            <Link href="/entrar">Entrar</Link>
            <Link href="/entrar?modo=criar" className="cab-cadastre">Cadastre-se</Link>
          </div>
          <details className="cab-hamb">
            <summary aria-label="Abrir o menu"><span /><span /><span /></summary>
            <nav className="cab-hamb-lista" aria-label="Menu">{menu}<Link href="/entrar">Entrar</Link><Link href="/entrar?modo=criar">Cadastre-se</Link></nav>
          </details>
        </div>
      </div>
      <div className="cab-sub">
        <div className="container cab-linha">
          <nav className="cab-atalhos" aria-label="Atalhos">
            <Link href="/loja">Loja</Link>
            <Link href="/#noticias">Notícias</Link>
            <Link href="/#editais">Editais</Link>
            <Link href="/como-funciona#dia">O plano de 2 horas</Link>
            <Link href="/como-funciona#teste" className="cab-destaque">Minissimulado grátis!</Link>
          </nav>
          {redes.length > 0 && (
            <span className="cab-redes">
              {redes.map(([nome, url]) => (
                <a key={nome} href={url} target="_blank" rel="noopener" aria-label={nome}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONE[nome]} /></svg>
                </a>
              ))}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
