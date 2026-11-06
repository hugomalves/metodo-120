import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { Formulario } from '@/components/Formulario';
import { CaixaDuvida } from '../CaixaDuvida';
import { avaliarResposta } from '../actions';
import s from '../aluno.module.css';

export const metadata = { title: 'Minhas dúvidas' };

type Msg = { id: string; do_professor: boolean; texto: string; criada_em: string };
type Duvida = { id: string; aula_id: string | null; contexto: string; status: string; lida_aluno: boolean; criada_em: string; duvida_mensagens: Msg[] };

const STATUS: Record<string, { rotulo: string; cor: string; texto: string }> = {
  pendente: { rotulo: 'Aguardando o professor', cor: 'var(--neutro-fundo)', texto: 'var(--suave)' },
  respondida: { rotulo: 'Respondida', cor: 'var(--ok-fundo)', texto: 'var(--ok-texto)' },
  sanada: { rotulo: 'Sanada', cor: 'var(--ok-fundo)', texto: 'var(--ok-texto)' },
  nao_compreendida: { rotulo: 'Professor vai explicar de novo', cor: 'var(--erro-fundo)', texto: 'var(--erro)' },
};

const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default async function MinhasDuvidas({ searchParams }: { searchParams: Promise<{ ctx?: string }> }) {
  const { ctx } = await searchParams;
  const { supabase, perfil } = await exigirCurso();
  const { data } = await supabase
    .from('duvidas')
    .select('id, aula_id, contexto, status, lida_aluno, criada_em, duvida_mensagens(id, do_professor, texto, criada_em)')
    .eq('aluno_id', perfil.id)
    .order('atualizada_em', { ascending: false })
    .order('criada_em', { referencedTable: 'duvida_mensagens' });
  const duvidas = (data ?? []) as Duvida[];
  if (duvidas.some((d) => !d.lida_aluno)) await supabase.rpc('marcar_duvidas_lidas');

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Minhas dúvidas' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Minhas dúvidas</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Só você e o professor veem estas conversas. Quando a resposta chegar, diga se entendeu: assim o professor sabe se precisa explicar de outro jeito.
        </p>
      </div>

      <CaixaDuvida contexto={ctx ? ctx.slice(0, 120) : undefined} titulo={ctx ? `Nova dúvida sobre: ${ctx.slice(0, 120)}` : 'Mandar uma dúvida geral'} aberta={!!ctx} />

      {duvidas.length === 0 && (
        <p className="suave" style={{ margin: 0 }}>Você ainda não mandou nenhuma dúvida. Dá para perguntar direto na página de cada aula.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {duvidas.map((d) => {
          const st = STATUS[d.status] ?? STATUS.pendente;
          return (
            <article key={d.id} className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderColor: !d.lida_aluno ? 'var(--ciano)' : undefined }}>
              <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {d.aula_id ? <Link href={`/aluno/aula/${d.aula_id}`} style={{ fontWeight: 700 }}>{d.contexto}</Link> : <strong>{d.contexto}</strong>}
                  <span className="suave" style={{ fontSize: 13 }}>Enviada em {quando(d.criada_em)}</span>
                </div>
                <span className={s.chip} style={{ background: st.cor, color: st.texto }}>{!d.lida_aluno ? 'Resposta nova' : st.rotulo}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.duvida_mensagens.map((m) => (
                  <div key={m.id} style={{
                    alignSelf: m.do_professor ? 'flex-start' : 'flex-end', maxWidth: 'min(640px, 100%)', padding: '10px 14px', borderRadius: 4,
                    background: m.do_professor ? 'var(--cartao-2)' : 'var(--ok-fundo)', border: m.do_professor ? '1px solid var(--destaque-borda)' : 'none',
                  }}>
                    <span className="rotulo" style={{ fontSize: 10, color: m.do_professor ? 'var(--ciano-texto)' : 'var(--ok-texto)' }}>{m.do_professor ? 'Prof. Hugo' : 'Você'} · {quando(m.criada_em)}</span>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.texto}</p>
                  </div>
                ))}
              </div>
              {d.status === 'respondida' && (
                <div className="linha-flex" style={{ alignItems: 'flex-start', gap: 12, borderTop: '1px solid var(--linha)', paddingTop: 12 }}>
                  <Formulario acao={avaliarResposta} botao="Entendi" classeBotao="btn btn-ciano">
                    <input type="hidden" name="duvida_id" value={d.id} />
                    <input type="hidden" name="entendeu" value="sim" />
                  </Formulario>
                  <details style={{ flex: '1 1 300px', minWidth: 0 }}>
                    <summary className="btn btn-linha" style={{ listStyle: 'none' }}>Ainda não entendi</summary>
                    <div style={{ paddingTop: 10 }}>
                      <Formulario acao={avaliarResposta} botao="Avisar o professor" classeBotao="btn btn-linha">
                        <input type="hidden" name="duvida_id" value={d.id} />
                        <input type="hidden" name="entendeu" value="nao" />
                        <div className="campo">
                          <label htmlFor={`nao-${d.id}`}>O que ainda não ficou claro? (opcional)</label>
                          <textarea id={`nao-${d.id}`} name="texto" rows={3} maxLength={2000} />
                        </div>
                      </Formulario>
                    </div>
                  </details>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
