import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarTrilha } from '@/lib/conteudo';
import { nivelDe } from '@/lib/habilidades';
import { participarRanking } from '@/app/conta/actions';
import { Formulario } from '@/components/Formulario';
import { Emblema, MedalhaNivel } from '@/components/Emblema';
import { EMBLEMAS_SEQUENCIA, FAIXAS, REGRA_PONTOS, SEM_CONQUISTAS, nivelPorPontos, proximoEmblema, type Conquistas } from '@/lib/conquistas';
import s from '../aluno.module.css';

export const metadata = { title: 'Suas estatísticas' };

type Envio = { simulado_id: string; acertos: number; enviado_em: string; simulado: { codigo: string; tipo: string; n_questoes: number; semana: number | null } | null };
type Hab = { habilidade: string; acertos: number; total: number; pct: number };
type Ranking = { posicao: number | null; total: number; evolucao: number | null; participa: boolean; liberado: boolean };
type LinhaRank = { posicao: number; apelido: string; evolucao: number | null; pontos: number; maior_sequencia: number; eu: boolean };

function Barras({ envios, titulo, vazio }: { envios: Envio[]; titulo: string; vazio: string }) {
  return (
    <section className="cartao" style={{ flex: '1 1 380px', minWidth: 0, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 className="display" style={{ margin: 0, fontSize: 19 }}>{titulo}</h2>
      {envios.length === 0 ? (
        <p className="suave" style={{ margin: 0 }}>{vazio}</p>
      ) : (
        <>
          <div className={s.barras}>
            {envios.map((e, i) => {
              const n = e.simulado?.n_questoes ?? 1;
              const altura = Math.max(6, Math.round((e.acertos / n) * 180));
              const ultimo = i === envios.length - 1;
              return (
                <Link key={e.simulado_id} href={`/aluno/simulado/${e.simulado_id}`} className={s.barra} aria-label={`${e.simulado?.codigo}: ${e.acertos} de ${n}. Abrir resultado`}>
                  <span className="mono" style={{ fontSize: 14 }}>{e.acertos}</span>
                  <span style={{ height: altura, background: ultimo ? 'var(--ciano)' : '#2E5BD8' }} />
                </Link>
              );
            })}
          </div>
          <div className={s.rotulosBarras}>
            {envios.map((e) => <span key={e.simulado_id}>{e.simulado?.semana ? `Sem. ${e.simulado.semana}` : e.simulado?.codigo}</span>)}
          </div>
          <span className="suave" style={{ fontSize: 14 }}>Altura proporcional aos acertos. Toque numa barra para ver o resultado e as questões que você errou.</span>
        </>
      )}
    </section>
  );
}

export default async function Estatisticas({ searchParams }: { searchParams: Promise<{ ordem?: string }> }) {
  const ordem = (await searchParams).ordem === 'pontos' ? 'pontos' : 'evolucao';
  const { supabase, perfil } = await exigirCurso();
  const [trilha, { data: enviosRaw }, { data: habsRaw }, { data: rankRaw }, { count: diasTotal }, { data: conqRaw }, { data: listaRaw }] = await Promise.all([
    carregarTrilha(supabase, perfil),
    supabase.from('envios').select('simulado_id, acertos, enviado_em, simulado:simulados(codigo, tipo, n_questoes, semana)')
      .eq('aluno_id', perfil.id).eq('conta_evolucao', true).order('enviado_em'),
    supabase.rpc('minhas_habilidades'),
    supabase.rpc('meu_ranking'),
    supabase.from('dias_estudo').select('dia', { count: 'exact', head: true }).eq('aluno_id', perfil.id),
    supabase.rpc('conquistas_de', { p_aluno: perfil.id }),
    supabase.rpc('ranking_turma', { p_ordem: ordem }),
  ]);

  const envios = (enviosRaw ?? []) as unknown as Envio[];
  const minis = envios.filter((e) => e.simulado?.tipo === 'mini');
  const completos = envios.filter((e) => e.simulado?.tipo === 'completo');
  const habs = (habsRaw ?? []) as Hab[];
  const rank = ((rankRaw ?? []) as Ranking[])[0];
  const evol = rank?.evolucao ?? null;
  const conq = ((conqRaw ?? []) as Conquistas[])[0] ?? SEM_CONQUISTAS;
  const nivel = nivelPorPontos(conq.pontos);
  const prox = proximoEmblema(conq.maior_sequencia);
  const lista = (listaRaw ?? []) as LinhaRank[];
  const conclusao = trilha.total ? Math.round((100 * trilha.concluidas) / trilha.total) : 0;
  const mediaMini = minis.length ? (minis.reduce((t, e) => t + e.acertos, 0) / minis.length).toFixed(1).replace('.', ',') : '–';

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Estatísticas' }]} />
      <h1 className={`display ${s.titulo}`}>Suas estatísticas</h1>

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="cartao" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className={s.rotuloPeq}>Conclusão do curso</span>
          <span className="display" style={{ fontSize: 28 }}>{conclusao}%</span>
          <span className={s.trilho}><span style={{ width: `${conclusao}%`, background: 'var(--ciano)' }} /></span>
          <span className="suave" style={{ fontSize: 14 }}>{trilha.concluidas} de {trilha.total} aulas</span>
        </div>
        <div className="cartao" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className={s.rotuloPeq}>Dias de estudo</span>
          <span className="display" style={{ fontSize: 28 }}>{diasTotal ?? 0}</span>
          <span className="suave" style={{ fontSize: 14 }}>desde o início</span>
        </div>
        <div className="cartao" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className={s.rotuloPeq}>Média nos minissimulados</span>
          <span className="display" style={{ fontSize: 28 }}>{mediaMini}</span>
          <span className="suave" style={{ fontSize: 14 }}>{minis.length} feitos</span>
        </div>
        <div className="cartao" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className={s.rotuloPeq}>Sua evolução</span>
          <span className="display" style={{ fontSize: 28, color: 'var(--ciano)' }}>
            {evol === null ? '–' : `${evol >= 0 ? '+' : ''}${evol}`}
          </span>
          <span className="suave" style={{ fontSize: 14 }}>acertos do 1º ao último minissimulado</span>
        </div>
      </div>

      <div className={s.duas}>
        <Barras envios={minis} titulo="Acertos nos minissimulados" vazio="Envie seu primeiro minissimulado para ver a evolução aqui." />
        <Barras envios={completos} titulo="Acertos nos simulados completos" vazio="Nenhum simulado completo enviado ainda." />
      </div>

      <section id="habilidades" className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="hab">
        <h2 id="hab" className="display" style={{ margin: 0, fontSize: 19 }}>Suas habilidades, da mais forte para a mais fraca</h2>
        {habs.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>O ranking das habilidades aparece depois do seu primeiro simulado.</p>
        ) : (
          <>
            <div className="linha-flex" style={{ gap: 8, fontSize: 13 }}>
              {[85, 65, 45, 20].map((p) => {
                const n = nivelDe(p);
                return <span key={n.rotulo} className={s.chip} style={{ background: n.cor, color: n.texto }}>{n.rotulo}</span>;
              })}
            </div>
            {habs.map((h, i) => {
              const n = nivelDe(h.pct);
              return (
                <Link key={h.habilidade} href={`/aluno/habilidade/${h.habilidade}`} className={s.habLinha} aria-label={`${i + 1}º lugar: ${h.habilidade}, ${h.pct}% de acertos, ${n.rotulo}`}>
                  <span className="mono suave">{i + 1}º</span>
                  <span className={s.selo} style={{ textAlign: 'center' }}>{h.habilidade}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span className={s.trilho}><span style={{ width: `${h.pct}%`, background: n.cor }} /></span>
                    <span className="suave" style={{ fontSize: 13 }}>{n.rotulo} · {h.acertos} de {h.total} questões</span>
                  </span>
                  <span className="mono" style={{ textAlign: 'right' }}>{h.pct}%</span>
                </Link>
              );
            })}
            <span className="suave" style={{ fontSize: 14 }}>Toque numa habilidade para ver as aulas, as listas e as questões dela. <Link href="/aluno/habilidades">Ver as 30 habilidades</Link></span>
          </>
        )}
      </section>

      <section id="conquistas" className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }} aria-labelledby="conq">
        <h2 id="conq" className="display" style={{ margin: 0, fontSize: 19 }}>Suas conquistas</h2>
        <div className="linha-flex" style={{ gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className={s.rotuloPeq}>Sequência atual</span>
            <span className="display" style={{ fontSize: 28 }}>{conq.sequencia_atual} {conq.sequencia_atual === 1 ? 'dia' : 'dias'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className={s.rotuloPeq}>Maior sequência</span>
            <span className="display" style={{ fontSize: 28, color: 'var(--ciano)' }}>{conq.maior_sequencia} {conq.maior_sequencia === 1 ? 'dia' : 'dias'}</span>
          </div>
          <span className="suave" style={{ flex: '1 1 260px', minWidth: 0, fontSize: 14 }}>
            Cada dia em que você conclui uma aula, envia um simulado ou resolve uma questão do banco conta. Os emblemas ficam com você para sempre.
          </span>
        </div>
        <div className={s.emblemas} role="list" aria-label="Emblemas de dias seguidos">
          {EMBLEMAS_SEQUENCIA.map((e) => {
            const ganho = conq.maior_sequencia >= e.dias;
            return (
              <div key={e.dias} role="listitem" className={s.emblema} aria-label={`${e.nome}: ${e.frase}. ${ganho ? 'Conquistado' : 'Ainda não conquistado'}`}>
                <Emblema forma={e.forma} cor={e.cor} texto={String(e.dias)} ganho={ganho} />
                <strong style={{ color: ganho ? 'var(--texto)' : 'var(--suave)' }}>{e.nome}</strong>
                <span>{e.dias} dias seguidos</span>
              </div>
            );
          })}
        </div>
        {prox && <span className="suave" style={{ fontSize: 14 }}>Próximo emblema: {prox.nome}, com {prox.dias} dias seguidos de estudo.</span>}

        <div className="linha-flex" style={{ gap: 16, borderTop: '1px solid var(--linha)', paddingTop: 16, alignItems: 'center' }}>
          <MedalhaNivel faixa={nivel.faixa} rotulo={nivel.rotulo} tamanho={72} />
          <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className={s.rotuloPeq}>Nível de estudo</span>
            <span className="display" style={{ fontSize: 24 }}>
              Nível {nivel.rotulo} · {nivel.faixa.nome} <span className="mono suave" style={{ fontSize: 15, fontWeight: 600 }}>{conq.pontos} pontos</span>
            </span>
            {!nivel.maximo && (
              <>
                <span className={s.trilho}><span style={{ width: `${nivel.pct}%`, background: nivel.faixa.cor }} /></span>
                <span className="suave" style={{ fontSize: 13 }}>
                  Mais {nivel.faltam} pontos para o nível {nivel.nivel + 1}{nivel.proximaFaixa ? `. ${nivel.proximaFaixa.nome} a partir do nível ${nivel.proximaFaixa.de}` : ''}
                </span>
              </>
            )}
          </div>
          <div className="linha-flex" style={{ gap: 8 }} role="list" aria-label="Faixas de nível">
            {FAIXAS.map((f) => (
              <span key={f.nome} role="listitem" title={`${f.nome}: a partir do nível ${f.de}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <MedalhaNivel faixa={f} rotulo={f.de === 99 ? '99+' : String(f.de)} tamanho={40} apagada={nivel.nivel < f.de} />
                <small className="suave" style={{ fontSize: 11 }}>{f.nome}</small>
              </span>
            ))}
          </div>
        </div>
        <span className="suave" style={{ fontSize: 13 }}>
          {conq.minutos_aula} min de aula · {conq.minis} minissimulados · {conq.completos} simulados completos · {conq.questoes} questões do banco. {REGRA_PONTOS}
        </span>
      </section>

      <section id="ranking" className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="rank">
        <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
          <h2 id="rank" className="display" style={{ margin: 0, fontSize: 19 }}>Ranking da turma</h2>
          {rank?.participa && rank.liberado && (
            <div className="linha-flex" style={{ gap: 6 }} role="group" aria-label="Ordenar o ranking">
              <Link href="/aluno/estatisticas?ordem=evolucao#ranking" aria-current={ordem === 'evolucao' ? 'true' : undefined} className={`btn ${ordem === 'evolucao' ? 'btn-ciano' : 'btn-linha'}`} style={{ minHeight: 38, fontSize: 14 }}>Por evolução</Link>
              <Link href="/aluno/estatisticas?ordem=pontos#ranking" aria-current={ordem === 'pontos' ? 'true' : undefined} className={`btn ${ordem === 'pontos' ? 'btn-ciano' : 'btn-linha'}`} style={{ minHeight: 38, fontSize: 14 }}>Por pontos</Link>
            </div>
          )}
        </div>

        {!rank?.participa ? (
          <>
            <span className="suave">
              Você não está participando. Seus resultados ficam visíveis só para você{rank?.liberado ? '' : ' e para o seu responsável'}.
              No ranking aparece apenas o seu apelido, nunca o seu nome.
              {!rank?.liberado && ' Como você é menor de idade, seu responsável também precisa autorizar.'}
            </span>
            <Formulario acao={participarRanking} botao="Participar do ranking">
              <input type="hidden" name="participar" value="sim" />
              <div className="campo" style={{ maxWidth: 320 }}>
                <label htmlFor="apelido">Seu apelido no ranking</label>
                <input id="apelido" name="apelido" type="text" required minLength={3} maxLength={20} defaultValue={perfil.apelido ?? ''} placeholder="Ex.: mat_no_foco" />
                <span className="suave" style={{ fontSize: 13 }}>De 3 a 20 letras ou números. Não use o seu nome completo.</span>
              </div>
            </Formulario>
          </>
        ) : !rank.liberado ? (
          <span className="suave">Falta a autorização do seu responsável. Assim que ele autorizar, você aparece no ranking como “{perfil.apelido}”.</span>
        ) : lista.length === 0 ? (
          <span className="suave">O ranking aparece quando houver participantes na sua turma.</span>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={s.tabelaRank}>
              <thead><tr><th>#</th><th>Apelido</th><th>Evolução</th><th>Pontos</th><th>Nível e emblemas</th></tr></thead>
              <tbody>
                {lista.map((r) => {
                  const melhor = [...EMBLEMAS_SEQUENCIA].reverse().find((e) => r.maior_sequencia >= e.dias);
                  const nv = nivelPorPontos(r.pontos);
                  return (
                    <tr key={r.apelido} className={r.eu ? s.linhaEu : undefined}>
                      <td className="mono">{r.posicao}º</td>
                      <td>{r.apelido}{r.eu ? ' (você)' : ''}</td>
                      <td className="mono">{r.evolucao === null ? '–' : `${r.evolucao >= 0 ? '+' : ''}${r.evolucao}`}</td>
                      <td className="mono">{r.pontos}</td>
                      <td>
                        <span className="linha-flex" style={{ gap: 4, flexWrap: 'nowrap' }}>
                          <span title={`Nível ${nv.rotulo} · ${nv.faixa.nome}`}><MedalhaNivel faixa={nv.faixa} rotulo={nv.rotulo} tamanho={30} /></span>
                          {melhor && <span title={`${melhor.nome}: ${melhor.frase}`}><Emblema forma={melhor.forma} cor={melhor.cor} texto={String(melhor.dias)} ganho tamanho={30} /></span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rank?.participa && (
          <Formulario acao={participarRanking} botao="Sair do ranking" classeBotao="btn btn-linha">
            <input type="hidden" name="participar" value="nao" />
          </Formulario>
        )}
        <span className="suave" style={{ fontSize: 13 }}>Evolução: acertos do seu 1º ao seu último minissimulado. Só o primeiro envio de cada simulado conta.</span>
      </section>
    </>
  );
}
