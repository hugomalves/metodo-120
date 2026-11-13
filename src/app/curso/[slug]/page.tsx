import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { EXPERT } from '@/lib/marca';
import { ColunasCurso } from '@/components/ColunasCurso';
import { carregarVideosCurso } from '@/lib/videos-curso';
import type { Produto } from '@/lib/loja';
import styles from './curso.module.css';

export const dynamic = 'force-dynamic';

const TIPO: Record<string, string> = { curso: 'Curso em PDF', simulados: 'Pacote de simulados', mentoria: 'Mentoria individual', banco: 'Banco de questões' };

// Página de um produto da loja (aberta a todos): o que é, o que inclui, preço e o botão de compra
export default async function CursoPagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('produtos')
    .select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta')
    .eq('slug', slug).maybeSingle();
  const p = data as Produto | null;
  if (!p || !p.venda_aberta) notFound();
  const videos = await carregarVideosCurso(supabase);

  return (
    <>
      <Cabecalho />
      <main className="container">
        <nav className={styles.caminho} aria-label="Caminho"><Link href="/">Início</Link> › <Link href="/#cursos">Cursos</Link> › <span>{p.nome}</span></nav>
        <section className={`tema-escuro ${styles.topo}`}>
          <div className={styles.texto}>
            <span className={styles.tipo}>{p.selo ?? TIPO[p.tipo] ?? 'Curso'}</span>
            <h1 className="display">{p.nome}</h1>
            {p.descricao && <p>{p.descricao}</p>}
          </div>
          <div className={styles.compra}>
            <span className={styles.compraRotulo}>{TIPO[p.tipo] ?? 'Curso'}</span>
            {p.preco ? <b className={styles.preco}>{p.preco}</b> : <b className={styles.preco}>Em breve</b>}
            {p.checkout_url ? (
              <a href={p.checkout_url} target="_blank" rel="noopener" className="btn btn-vermelho btn-grande">Quero este →</a>
            ) : (
              <>
                <span className={styles.aviso}>As vendas deste curso abrem em breve. Crie a sua conta grátis para treinar com o banco de questões enquanto isso.</span>
                <Link href="/entrar?modo=criar" className="btn btn-azul btn-grande">Criar conta grátis</Link>
              </>
            )}
          </div>
        </section>

        <ColunasCurso videos={videos} />

        {p.beneficios.length > 0 && (
          <section className={styles.secao} aria-labelledby="inclui">
            <h2 id="inclui" className="display">O que está incluído</h2>
            <ul className={styles.lista}>{p.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>
          </section>
        )}

        <section className={styles.secao} aria-labelledby="como">
          <h2 id="como" className="display">Como funciona o dia de estudo</h2>
          <div className={styles.blocos}>
            <div><b>Bloco 1 · 50 min</b><span>Aula em PDF do assunto do dia e questões sobre ele.</span></div>
            <div><b>Bloco 2 · 50 min</b><span>Questões no estilo da banca de outra disciplina.</span></div>
            <div><b>Bloco 3 · 20 min</b><span>Caderno de erros: você refaz o que errou antes de esquecer.</span></div>
          </div>
          <Link href="/como-funciona" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Ver o plano completo</Link>
        </section>

        <section className={`cartao ${styles.expert}`}>
          <img src={EXPERT.fotoRosto} alt={EXPERT.nome} width={96} height={96} />
          <div><b>{EXPERT.nome}</b><span>{EXPERT.resumo}</span></div>
        </section>
      </main>
    </>
  );
}
