import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { acessoAtual } from '@/lib/acesso';
import { carregarQuestoes } from '@/lib/questao';
import { alternativasDe, origemQuestao } from '@/components/CartaoQuestao';
import { MARCA } from '@/lib/marca';
import { Logo120 } from '@/components/Marca';
import { TextoRico, TextoAlternativa } from '@/components/TextoRico';
import { NIVEIS } from '@/lib/assuntos';
import { BarraImpressao } from '../../BarraImpressao';
import s from '../../imprimir.module.css';

export const metadata = { title: `Lista para imprimir · ${MARCA.nome}` };

const dd = (n: number) => String(n).padStart(2, '0');

export default async function ImprimirLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil, acesso } = await acessoAtual();
  const { data } = await supabase.from('listas_questoes').select('id, titulo, questoes, criada_em').eq('id', id).eq('aluno_id', perfil.id).maybeSingle();
  const lista = data as { id: string; titulo: string; questoes: string[]; criada_em: string } | null;
  if (!lista) notFound();

  const questoes = await carregarQuestoes(supabase, perfil.id, lista.questoes);
  const h = await headers();
  const site = h.get('host') ?? '';
  const linkOnline = `${site}/aluno/questoes/lista/${lista.id}`;
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return (
    <div className={s.pagina}>
      <style>{`
        @page { size: A4; margin: 12mm 12mm 15mm;
          @bottom-left { content: "${MARCA.nome} · ${MARCA.professor}"; font: 600 8pt Arial, sans-serif; color: #5b6784; }
          @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 600 8pt Arial, sans-serif; color: #5b6784; } }
        html, body { background: #e9edf5; }
        @media print { html, body { background: #fff; } }
      `}</style>
      <BarraImpressao voltar={`/aluno/questoes/lista/${lista.id}`} />

      <main className={s.folha}>
        <header className={s.capa}>
          <div className={s.logoCaixa}><Logo120 tamanho={52} slogan /></div>
          <div className={s.capaTexto}>
            <span className={s.kicker}>Lista impressa</span>
            <h1 className={s.titulo}>{lista.titulo}</h1>
            <div className={s.chips}>
              <span>{hoje}</span>
              <span>{MARCA.professor}</span>
            </div>
          </div>
        </header>

        <section className={s.identificacao}>
          <div><span>Aluno</span><b>{perfil.nome}</b></div>
          <div><span>Início</span><b>____:____</b></div>
          <div><span>Fim</span><b>____:____</b></div>
          <div><span>Acertos</span><b>_____ / {questoes.length}</b></div>
        </section>

        <section className={s.instrucoes}>
          <b>Como usar esta lista</b>
          <ol>
            <li>Resolva as questões no papel, com calma, como na prova.</li>
            <li>Marque suas respostas no cartão-resposta da última página.</li>
            <li>Lance as respostas na lista on-line para ver a correção e a resolução comentada: <span className={s.link}>{linkOnline}</span></li>
          </ol>
        </section>

        <div className={s.colunas}>
          {questoes.map((q, i) => {
            const meta = [origemQuestao(q), q.disciplina, q.nivel ? NIVEIS[q.nivel] : null].filter(Boolean).join(' · ');
            const emTexto = q.formato !== 'imagem' || !q.imagem;
            const novoTexto = q.textoBase && questoes[i - 1]?.textoBase?.id !== q.textoBase.id;
            return (
              <article key={q.id} className={s.questao} data-questao>
                {novoTexto && (
                  <div className={s.qTexto} style={{ borderLeft: '3px solid #1f6bff', paddingLeft: 8, marginBottom: 8 }}>
                    <TextoRico texto={q.textoBase!.texto} figuras={q.textoBase!.figuras} />
                  </div>
                )}
                <div className={s.qCabeca}>
                  <span className={s.qNumero}>Questão {dd(i + 1)}</span>
                  <span className={s.qMeta}>{meta}</span>
                </div>
                {emTexto ? (
                  <div className={s.qTexto}>
                    <TextoRico texto={q.enunciado} figuras={q.figuras} />
                    {q.tipo === 'certo_errado' ? (
                      <p style={{ margin: '4px 0 0', fontWeight: 700 }}>( &nbsp; ) Certo &nbsp;&nbsp; ( &nbsp; ) Errado</p>
                    ) : (
                      <ol className={s.qAlts}>
                        {alternativasDe(q).map((a) => (
                          <li key={a.letra}><b>{a.letra}</b> <TextoAlternativa texto={a.texto} figuras={q.figuras} /></li>
                        ))}
                      </ol>
                    )}
                  </div>
                ) : (
                  <img src={q.imagem!} alt={`Questão ${i + 1}`} className={s.qImagem} />
                )}
              </article>
            );
          })}
        </div>

        <section className={s.cartao}>
          <div className={s.cartaoTopo}>
            <img src="/img/icone-120.png" alt="" className={s.cartaoIcone} />
            <div>
              <span className={s.kickerEscuro}>Cartão-resposta</span>
              <h2>{lista.titulo}</h2>
            </div>
          </div>
          <div className={s.cartaoAluno}>Aluno: <b>{perfil.nome}</b><span>Data: ____/____/______</span></div>
          <div className={s.grade}>
            {questoes.map((q, i) => (
              <div key={q.id} className={s.linhaCartao}>
                <span className={s.numCartao}>{dd(i + 1)}</span>
                {alternativasDe(q).map((a) => <span key={a.letra} className={s.bolha}>{a.letra}</span>)}
              </div>
            ))}
          </div>
          <p className={s.cartaoNota}>
            Preencha uma opção por questão (no certo/errado: C ou E; na dúvida, pode deixar em branco). Depois, lance as respostas em <b>{linkOnline}</b> para ver a correção comentada.
          </p>
        </section>
      </main>
    </div>
  );
}
