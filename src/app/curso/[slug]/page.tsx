import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { ColunasCurso } from '@/components/ColunasCurso';
import { EXPERT } from '@/lib/marca';
import { diasAte } from '@/lib/datas';
import { carregarVideosCurso } from '@/lib/videos-curso';
import type { Produto } from '@/lib/loja';
import styles from './curso.module.css';

export const dynamic = 'force-dynamic';

const TIPO: Record<string, string> = { curso: 'Curso em PDF', simulados: 'Pacote de simulados', mentoria: 'Mentoria individual', banco: 'Banco de questões' };

// Fotos de abertura e de faixa por curso (arquivos em public/img/reta-final/). Sem entrada aqui, a página usa só o azul-marinho.
const IMAGENS: Record<string, { hero?: string; faixa?: string }> = {
  'reta-final-pmpe': { hero: '/img/reta-final/formatura.webp', faixa: '/img/reta-final/tropa.webp' },
};

type Edital = {
  nome: string; orgao: string; banca: string | null; data_prova: string | null; observacoes: string | null;
  corte_bloco: number | null; corte_total: number | null; sem_zerar: boolean;
  edital_disciplinas: { disciplina: string; questoes: number; bloco: string | null; ordem: number }[];
};

const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const sombra = (url: string, forte = 0.95) => `linear-gradient(90deg, rgba(7,26,61,${forte}) 0%, rgba(7,26,61,0.85) 50%, rgba(7,26,61,0.55) 100%), url(${url})`;

// Botão de compra (ou de conta grátis, enquanto o link da Kiwify não foi cadastrado)
function Cta({ p, grande = true }: { p: Produto; grande?: boolean }) {
  const g = grande ? ' btn-grande' : '';
  return p.checkout_url
    ? <a href={p.checkout_url} target="_blank" rel="noopener" className={`btn btn-vermelho${g}`}>Quero este →</a>
    : <Link href="/entrar?modo=criar" className={`btn btn-azul${g}`}>Criar conta grátis</Link>;
}

// Página de um produto da loja (aberta a todos): o que é, o que inclui, preço e o botão de compra.
// Cursos ligados a um edital ganham também a prova em números e a contagem de dias.
export default async function CursoPagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('produtos')
    .select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta, acesso_ate')
    .eq('slug', slug).maybeSingle();
  const p = data as (Produto & { acesso_ate: string | null }) | null;
  if (!p || !p.venda_aberta) notFound();

  const [videos, edRes] = await Promise.all([
    carregarVideosCurso(supabase),
    p.edital_id
      ? supabase.from('editais')
          .select('nome, orgao, banca, data_prova, observacoes, corte_bloco, corte_total, sem_zerar, edital_disciplinas(disciplina, questoes, bloco, ordem)')
          .eq('id', p.edital_id).eq('publicado', true).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const ed = (edRes.data ?? null) as Edital | null;
  const img = IMAGENS[p.slug] ?? {};

  // prova em números (só para curso ligado a edital)
  const disc = [...(ed?.edital_disciplinas ?? [])].sort((a, b) => a.ordem - b.ordem);
  const totalQuestoes = disc.reduce((s, d) => s + d.questoes, 0);
  const dias = ed?.data_prova ? diasAte(ed.data_prova) : null;
  const blocos = disc.reduce<{ nome: string; itens: typeof disc }[]>((acc, d) => {
    const nome = d.bloco ?? 'Disciplinas';
    const g = acc.find((x) => x.nome === nome);
    if (g) g.itens.push(d); else acc.push({ nome, itens: [d] });
    return acc;
  }, []);
  const regra = [
    ed?.corte_bloco ? `mínimo de ${Math.round(ed.corte_bloco * 100)}% em cada bloco` : null,
    ed?.corte_total ? `mínimo de ${Math.round(ed.corte_total * 100)}% no total` : null,
    ed?.sem_zerar ? 'não zerar nenhuma disciplina' : null,
  ].filter(Boolean) as string[];

  const perguntas: { q: string; a: string }[] = [
    { q: 'Como recebo o acesso depois de pagar?', a: 'Você paga no checkout da Kiwify e cria a sua conta aqui no site com o mesmo e-mail da compra. O acesso é liberado automaticamente, mesmo que você crie a conta depois de pagar.' },
    { q: 'Posso testar antes de comprar?', a: 'Pode. Crie a conta grátis e use o banco de questões, com limite diário, e um minissimulado por dia.' },
    { q: 'O curso garante a aprovação?', a: 'Não. O Método 120 entrega o plano: 2 horas por dia, organizadas pelo que o edital cobra e pelo estilo da banca. A aprovação depende da sua dedicação e da concorrência.' },
    { q: 'Posso imprimir o material?', a: 'Sim. As listas de questões podem ser impressas em PDF quantas vezes você quiser.' },
    ...(p.acesso_ate ? [{ q: 'Até quando vale o meu acesso?', a: `O acesso a este curso vale até ${dataBr(p.acesso_ate)}.` }] : []),
    { q: 'E se eu não gostar?', a: 'Os dias de garantia e como pedir o reembolso aparecem no checkout da Kiwify, antes de você pagar.' },
  ];

  return (
    <>
      <Cabecalho />
      <main className={`container ${styles.pagina}`}>
        <nav className={styles.caminho} aria-label="Caminho"><Link href="/">Início</Link> › <Link href="/#cursos">Cursos</Link> › <span>{p.nome}</span></nav>

        <section
          className={`tema-escuro ${styles.topo}`}
          style={img.hero ? { backgroundImage: sombra(img.hero), backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <div className={styles.texto}>
            <span className={styles.tipo}>{p.selo ?? TIPO[p.tipo] ?? 'Curso'}</span>
            <h1 className="display">{p.nome}</h1>
            {p.descricao && <p>{p.descricao}</p>}
            {ed && (
              <ul className={styles.numeros} aria-label="O edital em números">
                {dias !== null && dias > 0 && <li><b>{dias}</b><span>dias até a prova</span></li>}
                {totalQuestoes > 0 && <li><b>{totalQuestoes}</b><span>questões na prova</span></li>}
                {disc.length > 0 && <li><b>{disc.length}</b><span>disciplinas</span></li>}
                {ed.banca && <li><b>{ed.banca}</b><span>banca</span></li>}
              </ul>
            )}
          </div>
          <div className={styles.compra}>
            <span className={styles.compraRotulo}>{TIPO[p.tipo] ?? 'Curso'}</span>
            {p.preco ? <b className={styles.preco}>{p.preco}</b> : <b className={styles.preco}>Em breve</b>}
            {p.checkout_url ? (
              <Cta p={p} />
            ) : (
              <>
                <span className={styles.aviso}>As vendas deste curso abrem em breve. Crie a sua conta grátis para treinar com o banco de questões enquanto isso.</span>
                <Cta p={p} />
              </>
            )}
          </div>
        </section>

        <ColunasCurso videos={videos} />

        {ed && disc.length > 0 && (
          <section className={styles.secao} aria-labelledby="prova">
            <h2 id="prova" className="display">A prova em números</h2>
            {ed.data_prova && <p className={styles.sub}>Prova em {dataBr(ed.data_prova)}{ed.banca ? `, banca ${ed.banca}` : ''}. O plano do curso é montado de trás para a frente a partir dessa data.</p>}
            <div className={styles.provaGrade}>
              {blocos.map((b) => (
                <div key={b.nome} className={styles.provaBloco}>
                  <b>{b.nome} · {b.itens.reduce((s, d) => s + d.questoes, 0)} questões</b>
                  <ul>{b.itens.map((d) => <li key={d.disciplina}><span>{d.disciplina}</span><em>{d.questoes}</em></li>)}</ul>
                </div>
              ))}
            </div>
            <div className={styles.regra}>
              <b>Regra de corte</b>
              <span>{regra.length ? `Para não ser eliminado: ${regra.join(', ')}.` : ed.observacoes}</span>
              <small>Este resumo é só um guia. Confira sempre o edital oficial.</small>
            </div>
          </section>
        )}

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

        <section
          className={`tema-escuro ${styles.faixa}`}
          style={img.faixa ? { backgroundImage: sombra(img.faixa, 0.92), backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <div>
            <h2 className="display">2 horas por dia. Todos os dias{ed?.data_prova && dias !== null && dias > 0 ? ` até ${dataBr(ed.data_prova)}` : ''}.</h2>
            <p>{p.preco ? `${p.nome} por ${p.preco}.` : 'As vendas abrem em breve.'} Sem promessa de aprovação: o que você recebe é o plano e as ferramentas para cumpri-lo.</p>
          </div>
          <Cta p={p} />
        </section>

        <section className={`cartao ${styles.expert}`} aria-label="Quem vai te guiar">
          <img src={EXPERT.fotoRosto} alt={EXPERT.nome} width={120} height={120} />
          <div>
            <span className={styles.expertRotulo}>{EXPERT.chamada}</span>
            <b>{EXPERT.nome}</b>
            <span>{EXPERT.resumo}</span>
            {EXPERT.aprovacoes.length > 0 && (
              <ul className={styles.aprovacoes} aria-label="Aprovações">{EXPERT.aprovacoes.map((a) => <li key={a}>{a}</li>)}</ul>
            )}
          </div>
        </section>

        <section className={styles.secao} aria-labelledby="duvidas-curso">
          <h2 id="duvidas-curso" className="display">Perguntas frequentes</h2>
          <div className={styles.faq}>
            {perguntas.map((x) => (
              <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>
            ))}
          </div>
        </section>

        <p className={styles.aviso2}>
          Curso preparatório independente. O Método 120 não tem vínculo com o órgão contratante{ed?.orgao ? ` (${ed.orgao})` : ''} nem com a banca organizadora{ed?.banca ? ` (${ed.banca})` : ''}.
        </p>
      </main>

      <div className={styles.fixo}>
        <div><b>{p.preco ?? 'Em breve'}</b><span>{p.nome}</span></div>
        <Cta p={p} grande={false} />
      </div>
    </>
  );
}
