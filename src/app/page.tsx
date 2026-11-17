import Link from 'next/link';
import { diasAte } from '@/lib/datas';
import { Logo120 } from '@/components/Marca';
import { Cabecalho } from '@/components/Cabecalho';
import type { SlideNoticia } from '@/components/CarrosselVitrine';
import { CartaoProduto } from '@/components/CartaoProduto';
import type { Produto as ProdutoLoja } from '@/lib/loja';
import { createClient } from '@/lib/supabase/server';
import { PLANOS, totalPlano } from '@/lib/planos';
import { EMPRESA, EXPERT, MARCA } from '@/lib/marca';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';

type Produto = { slug: string; nome: string; tipo: string; venda_aberta: boolean; checkout_url: string | null; preco: string | null; descricao: string | null; beneficios: string[] | null; edital_id: string | null; destaque: boolean; selo: string | null };
type Edital = { id: string; nome: string; banca: string | null; situacao: string; data_prova: string | null; edital_disciplinas: { disciplina: string; questoes: number; ordem: number }[] };

async function carregar(): Promise<{ produtos: Produto[]; editais: Edital[]; noticias: SlideNoticia[]; loja: ProdutoLoja[] }> {
  try {
    const supabase = await createClient();
    const [{ data: p }, { data: e }, { data: n }, { data: l }] = await Promise.all([
      supabase.from('produtos').select('slug, nome, tipo, venda_aberta, checkout_url, preco, descricao, beneficios, edital_id, destaque, selo').not('slug', 'like', 'plano-%'),
      supabase.from('editais').select('id, nome, banca, situacao, data_prova, edital_disciplinas(disciplina, questoes, ordem)').eq('publicado', true).order('data_prova', { nullsFirst: false }),
      supabase.from('noticias').select('id, rotulo, titulo, resumo, link, botao, imagem_path').eq('publicada', true).order('ordem').order('publicada_em', { ascending: false }).limit(8),
      supabase.from('produtos').select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta, imagem_path').eq('venda_aberta', true).not('slug', 'like', 'plano-%').in('tipo', ['curso', 'simulados', 'mentoria']).order('ordem').order('nome'),
    ]);
    const noticias = ((n ?? []) as (Omit<SlideNoticia, 'imagem'> & { imagem_path: string | null })[]).map(({ imagem_path, ...x }) => ({
      ...x, imagem: imagem_path ? supabase.storage.from('vitrine').getPublicUrl(imagem_path).data.publicUrl : null,
    }));
    return { produtos: (p ?? []) as Produto[], editais: (e ?? []) as Edital[], noticias, loja: (l ?? []) as ProdutoLoja[] };
  } catch {
    return { produtos: [], editais: [], noticias: [], loja: [] };
  }
}

const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const ICONES: Record<string, string> = {
  cronograma: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  banco: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  pdf: 'M7 3h7l4 4v14H7zM14 3v4h4M10 13h5M10 17h5',
  simulado: 'M4 5h16v14H4zM8 9l2 2 3-3M8 15h8',
  comentada: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  professor: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0',
  revisao: 'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5',
  edital: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
};
const Icone = ({ n }: { n: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONES[n]} /></svg>
);

const RECURSOS: [string, string, string][] = [
  ['cronograma', 'Cronograma interativo', 'O que estudar e o que revisar em cada dia, de acordo com o peso das disciplinas no edital.'],
  ['banco', 'Banco de questões', 'Questões de provas reais por banca, filtradas por edital, disciplina e assunto.'],
  ['pdf', 'PDFs completos', 'Aulas em PDF com questões e minissimulado em cada aula.'],
  ['simulado', 'Simulados no padrão da banca', 'Formato e regra de corte do edital, para treinar do jeito que será a prova.'],
  ['comentada', 'Resolução comentada', 'Gabarito com explicação em cada questão, para você entender o erro.'],
  ['professor', 'Pergunte ao professor', 'Dúvida numa questão? Pergunte direto na página dela.'],
  ['revisao', 'Revisões automáticas', 'O cronograma agenda as revisões e controla o seu tempo de estudo.'],
  ['edital', 'Edital verticalizado', 'Veja seu aproveitamento por disciplina e onde ainda falta estudar.'],
];

export default async function Vitrine() {
  const { produtos, editais, noticias, loja } = await carregar();
  const cursoAberto = produtos.find((p) => p.tipo === 'curso' && p.venda_aberta && p.checkout_url);
  const abertos = editais.filter((e) => e.situacao === 'aberto');
  const foto = EXPERT.fotoCorpo ?? EXPERT.fotoRosto;
  const ctaHref = cursoAberto?.checkout_url ?? '/planos';

  return (
    <div className="tema-site">
      <Cabecalho />

      <main className={styles.pagina}>
        {/* ===== HERO ===== */}
        <section className={styles.hero}>
          <div className={`${styles.miolo} ${styles.heroDentro}`}>
            <div>
              <div className={styles.etiquetas}><span>//{MARCA.nome}</span><span>Plano de 1 ano</span></div>
              <h1 className={`display ${styles.heroTitulo}`}>Eu tenho um plano para você <span className={styles.acento}>chutar a CLT.</span></h1>
              <p className={styles.heroSub}>{MARCA.descricao}</p>
              <p className={styles.heroForte}>2 horas. Todos os dias. Por 1 ano.</p>
              <div className={styles.heroAcoes}>
                <Link href="/planos" className="btn-claro grande"><span>Quero conhecer o plano</span><i>→</i></Link>
                <Link href="/entrar?modo=criar" className={styles.linkSimples}>Criar conta grátis</Link>
              </div>
              <p className={styles.heroNumero}><b>2h/dia</b>com o plano do dia sempre pronto</p>
            </div>
            <div className={styles.painelFoto}>
              <img src={foto} alt={EXPERT.nome} width={900} height={1100} />
              <div className={styles.painelLegenda}>{EXPERT.chamada}<b>{EXPERT.nome}</b></div>
            </div>
          </div>
        </section>
        <div className={styles.faixaCarreiras}>
          <div className={`${styles.miolo} ${styles.carreiras}`}>
            <b>Carreiras policiais</b><i>/</i><span>PM</span><i>/</i><span>PC</span><i>/</i><span>PRF</span><i>/</i><span>PF</span><i>/</i><span>Bombeiros</span><i>/</i><span>Guarda municipal</span>
          </div>
        </div>

        {/* ===== TUDO QUE VOCÊ TERÁ ===== */}
        <section className={`${styles.secao} ${styles.grade} ${styles.brilho}`} id="recursos">
          <div className={styles.miolo}>
            <div className={styles.cabeca}>
              <div><span className="rotulo">Método 120</span><h2 className="display">Tudo que você terá dentro da plataforma</h2></div>
              <p>Muito além de PDF solto: um plano de estudo completo, com tudo filtrado para o seu concurso.</p>
            </div>
            <div className={styles.numeros}>
              {[['2h', 'de estudo por dia'], ['365', 'dias de plano'], ['A–E', 'questões por banca'], ['100%', 'guiado pelo edital']].map(([n, t]) => (
                <div key={t} className={styles.numero}><b>{n}</b><span>{t}</span></div>
              ))}
            </div>
            <div className={styles.recursos}>
              {RECURSOS.map(([ic, t, d]) => (
                <div key={t} className={styles.recurso}><Icone n={ic} /><h3>{t}</h3><p>{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== COMO FUNCIONA NA PRÁTICA ===== */}
        <section className={styles.secao} id="como-estudar">
          <div className={styles.miolo}>
            <div className={styles.cabeca}>
              <div><span className="rotulo">Na prática</span><h2 className="display">Veja como você estuda todo dia</h2></div>
              <p>Estude certo, evolua e aprove. Três telas que você vai usar o ano inteiro.</p>
            </div>
            <div className={styles.linhas}>
              <div className={styles.linha}>
                <div className={styles.linhaVisual}>
                  <div className={styles.tela}>
                    <div className={styles.abas}><b>Cronograma</b><span>Histórico</span><span>Calendário</span><span>Edital</span></div>
                    <div className={styles.duas}>
                      <div className={styles.caixa}><h4>Estudos</h4>
                        <div className={styles.item}><small>Bloco 1</small><strong>Direito Constitucional</strong><em>Registrar</em></div>
                        <div className={styles.item}><small>Bloco 2</small><strong>Língua Portuguesa</strong><em>Registrar</em></div>
                      </div>
                      <div className={styles.caixa} data-t="rev"><h4>Revisões</h4>
                        <div className={styles.item}><small>Revisão de 7 dias</small><strong>Informática</strong><em>Revisar</em></div>
                        <div className={styles.item}><small>Revisão de 1 dia</small><strong>Raciocínio Lógico</strong><em>Revisar</em></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.linhaTexto}>
                  <span className={styles.passo}>01 / 03</span>
                  <h3 className="display">Cronograma interativo</h3>
                  <p>O plano do dia já vem pronto: o que estudar, o que revisar e quanto tempo falta. <b>Você só abre e estuda.</b> Registre o tempo e acompanhe a previsão de conclusão do edital.</p>
                </div>
              </div>
              <div className={styles.linha}>
                <div className={styles.linhaVisual}>
                  <div className={styles.tela}>
                    <div className={styles.abas}><b>Questão</b><span>Comentário</span></div>
                    <div className={styles.alt}><b>A</b>Alternativa que parece certa</div>
                    <div className={styles.alt} data-ok><b>B</b>Alternativa correta, com resolução comentada</div>
                    <div className={styles.alt}><b>C</b>Alternativa com pegadinha da banca</div>
                    <span className={styles.perg}>Perguntar ao professor</span>
                  </div>
                </div>
                <div className={styles.linhaTexto}>
                  <span className={styles.passo}>02 / 03</span>
                  <h3 className="display">Questões da sua banca</h3>
                  <p>Filtre por edital, disciplina, assunto e banca. Cada questão tem gabarito e resolução comentada, e <b>você pergunta ao professor</b> na própria página.</p>
                </div>
              </div>
              <div className={styles.linha}>
                <div className={styles.linhaVisual}>
                  <div className={styles.tela}>
                    <div className={styles.abas}><b>Edital verticalizado</b></div>
                    <div className={styles.barras}>
                      {[['Português', 78, 'ok'], ['Direito Penal', 64, ''], ['Constitucional', 52, ''], ['Informática', 31, ''], ['Raciocínio', 22, '']].map(([n, v, m]) => (
                        <div key={n as string} className={styles.barra} data-m={m || undefined}><span style={{ textAlign: 'left', color: '#c9ced8', fontFamily: 'inherit' }}>{n}</span><div><i style={{ width: `${v}%` }} /></div><span>{v}%</span></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.linhaTexto}>
                  <span className={styles.passo}>03 / 03</span>
                  <h3 className="display">Seu aproveitamento no edital</h3>
                  <p>Simulados no padrão da banca e um painel que mostra, disciplina por disciplina, <b>onde você acerta e onde precisa voltar</b>. A tela acima é um exemplo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {noticias.length > 0 && (
          <section className={`${styles.secao} ${styles.secaoClara} ${styles.grade}`} id="noticias">
            <div className={styles.miolo}>
              <div className={styles.cabeca}><div><span className="rotulo">Novidades</span><h2 className="display">Fique por dentro</h2></div></div>
              <div className={styles.editais}>
                {noticias.map((n) => (
                  <article key={n.id} className={`${styles.edital} cartao`}>
                    {n.rotulo && <span className={styles.selo}>{n.rotulo}</span>}
                    <h3 className="display">{n.titulo}</h3>
                    {n.resumo && <p className="suave" style={{ margin: 0 }}>{n.resumo}</p>}
                    {n.link && <a href={n.link} className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>{n.botao || 'Saiba mais'}</a>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== FRASE GRANDE ===== */}
        <section className={`${styles.frase} ${styles.grade} ${styles.brilho} ${styles.secaoClara}`}>
          <div className={styles.miolo}>
            <span className="rotulo">Método 120</span>
            <h2 className="display">No longo prazo, <span className={styles.acento}>constância vence.</span></h2>
            <div className={styles.fraseBase}>
              <strong>Um plano de estudo completo, feito para quem quer aprovação e não tem tempo a perder.</strong>
              <p>Aqui não tem enrolação.<b>É estudo certo e nada mais.</b></p>
            </div>
          </div>
        </section>

        {/* ===== EDITAIS ===== */}
        <section className={styles.secao} id="editais">
          <div className={styles.miolo}>
            <div className={styles.cabeca}>
              <div><span className="rotulo">Editais</span><h2 className="display">{abertos.length ? 'Editais abertos agora' : 'Editais acompanhados'}</h2></div>
              <p>Cada edital vira disciplinas com o peso de questões da prova, e o seu plano de estudo segue esses pesos.</p>
            </div>
            {editais.length === 0 ? (
              <p className="suave" style={{ margin: 0 }}>Os editais acompanhados aparecem aqui.</p>
            ) : (
              <div className={styles.editais}>
                {editais.map((e) => {
                  const dias = e.data_prova ? diasAte(e.data_prova) : null;
                  const discs = [...e.edital_disciplinas].sort((a, b) => a.ordem - b.ordem);
                  const rf = produtos.find((p) => p.destaque && p.venda_aberta && p.checkout_url && p.edital_id === e.id);
                  return (
                    <article key={e.id} className={`cartao ${styles.edital}`}>
                      <div className="linha-flex" style={{ justifyContent: 'space-between', gap: 8 }}>
                        <span className={styles.selo} data-situacao={e.situacao}>{e.situacao === 'aberto' ? 'Edital aberto' : e.situacao === 'previsto' ? 'Previsto' : 'Encerrado'}</span>
                        {dias !== null && dias > 0 && <span className={styles.contagem}><b>{dias}</b> dias para a prova</span>}
                      </div>
                      <h3 className="display">{e.nome}</h3>
                      <span className="suave">{[e.banca, e.data_prova ? `prova em ${dataBr(e.data_prova)}` : null].filter(Boolean).join(' · ')}</span>
                      <ul className={styles.discs}>
                        {discs.map((d) => <li key={d.disciplina}><span>{d.disciplina}</span><b>{d.questoes}</b></li>)}
                      </ul>
                      {rf && (
                        <a href={rf.checkout_url!} target="_blank" rel="noopener" className={styles.retaFinal}>
                          <span className={styles.retaSelo}>{rf.selo ?? 'Reta final'}</span>
                          <b>{rf.nome}</b>
                          {rf.descricao && <span>{rf.descricao}</span>}
                          <span className={styles.retaPreco}>{rf.preco ?? ''}<em>Garantir minha vaga →</em></span>
                        </a>
                      )}
                      <Link href="/entrar?modo=criar" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Treinar grátis neste edital</Link>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {loja.length > 0 && (
          <section id="cursos" className={`${styles.secao} ${styles.secaoClara} ${styles.grade}`}>
            <div className={styles.miolo}>
              <div className={styles.cabeca}>
                <div><span className="rotulo">Cursos</span><h2 className="display">Escolha o seu curso</h2></div>
                <p>Aulas em PDF com questões, minissimulado em cada aula, revisões e simulados no padrão da banca, dentro do plano de 2 horas por dia.</p>
              </div>
              <div className="loja-grade">
                {[...loja].sort((a, b) => Number(b.destaque) - Number(a.destaque) || a.ordem - b.ordem).map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}
              </div>
            </div>
          </section>
        )}

        {/* ===== OFERTA / PLANOS ===== */}
        <section className={`${styles.secao} ${styles.grade} ${styles.brilho}`} id="oferta">
          <div className={styles.miolo}>
            <div className={styles.cabeca}>
              <div><span className="rotulo">Oferta</span><h2 className="display">Preço fechado, <span className={styles.acento}>1 ano de acesso</span></h2></div>
              <p>Escolha o plano, pague em até 12x e estude por 1 ano inteiro.</p>
            </div>
            <div className={styles.planos}>
              {PLANOS.map((pl) => (
                <article key={pl.chave} className={styles.plano} data-destaque={pl.destaque ? 'sim' : undefined}>
                  <div className={styles.planoTopo}>{pl.selo ?? (pl.chave === 'basico' ? 'Para começar' : 'Foco no concurso')}</div>
                  <div className={styles.planoCorpo}>
                    <h3 className="display">{pl.nome}</h3>
                    <div className={styles.planoPreco}>
                      <small>{pl.parcelas}x de</small>
                      <b><span>R$</span>{pl.parcela}</b>
                      <em>Total R$ {totalPlano(pl)} · 1 ano</em>
                    </div>
                    <ul>{pl.itens.filter((i) => !i.emBreve).slice(0, 5).map((i) => <li key={i.texto}>{i.texto}</li>)}</ul>
                    <Link href="/planos" className={`btn btn-azul ${styles.acao}`}>Ver o plano</Link>
                  </div>
                </article>
              ))}
            </div>
            <div className={`${styles.cta} ${styles.corte}`}>
              <div><span className="rotulo">Comece agora</span><h3 className="display">Prefira testar antes? Treine grátis.</h3><p>Crie sua conta e resolva questões todos os dias, com gabarito e resolução. Sem cartão de crédito.</p></div>
              <Link href="/entrar?modo=criar" className="btn-claro grande"><span>Criar conta grátis</span><i>→</i></Link>
            </div>
          </div>
        </section>

        {/* ===== QUEM VAI TE GUIAR ===== */}
        <section className={`${styles.secao} ${styles.secaoClara}`} aria-labelledby="expert">
          <div className={`${styles.miolo} ${styles.expert}`}>
            <div className={styles.painelFoto}><img src={EXPERT.fotoRosto} alt={EXPERT.nome} width={600} height={600} /></div>
            <div>
              <span className="rotulo">{EXPERT.chamada}</span>
              <h2 id="expert" className="display">{EXPERT.nome}</h2>
              <p>{EXPERT.resumo}</p>
              <ul className={styles.aprovacoes}>{EXPERT.aprovacoes.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.rodape}>
        <div className={`${styles.miolo} ${styles.rodapeDentro}`}>
          <Logo120 tamanho={44} slogan />
          <span className="linha-flex" style={{ gap: 16 }}>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
          </span>
          <small style={{ opacity: 0.8, fontSize: 13 }}>{EMPRESA.razao} · CNPJ {EMPRESA.cnpj} · {EMPRESA.email}</small>
          <small style={{ opacity: 0.6, fontSize: 12 }}>{MARCA.nome} não tem vínculo com bancas organizadoras nem com os órgãos citados. Questões de provas oficiais são usadas para fins educacionais.</small>
        </div>
      </footer>
    </div>
  );
}
