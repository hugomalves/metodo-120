import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { Formulario } from '@/components/Formulario';
import { encerrarDuvida, responderDuvida } from '../actions';
import styles from '../professor.module.css';

export const metadata = { title: 'Plantão de dúvidas · Painel do professor' };

type Msg = { id: string; do_professor: boolean; texto: string; criada_em: string };
type Duvida = {
  id: string; contexto: string; status: string; criada_em: string; atualizada_em: string; aula_id: string | null;
  aluno: { nome: string; apelido: string | null } | null; duvida_mensagens: Msg[];
};

const ABAS = [
  { f: 'pendentes', rotulo: 'Pendentes', status: ['pendente'] },
  { f: 'nao', rotulo: 'Não compreendidas', status: ['nao_compreendida'] },
  { f: 'respondidas', rotulo: 'Respondidas, aguardando o aluno', status: ['respondida'] },
  { f: 'sanadas', rotulo: 'Sanadas', status: ['sanada'] },
] as const;

const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default async function PlantaoDuvidas({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const aba = ABAS.find((a) => a.f === f) ?? ABAS[0];
  const supabase = await createClient();

  const [{ data }, { data: todas }] = await Promise.all([
    supabase.from('duvidas')
      .select('id, contexto, status, criada_em, atualizada_em, aula_id, aluno:perfis(nome, apelido), duvida_mensagens(id, do_professor, texto, criada_em)')
      .in('status', [...aba.status])
      .order('atualizada_em', { ascending: aba.f === 'pendentes' || aba.f === 'nao' })
      .order('criada_em', { referencedTable: 'duvida_mensagens' })
      .limit(100),
    supabase.from('duvidas').select('status'),
  ]);
  const duvidas = (data ?? []) as unknown as Duvida[];
  const contagem = (st: readonly string[]) => ((todas ?? []) as { status: string }[]).filter((d) => st.includes(d.status)).length;

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Plantão de dúvidas' }]} />
      <h1 className={`display ${styles.titulo}`}>Plantão de dúvidas</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>
        Dúvidas privadas: só você e o aluno veem. Quando você responde, o aluno diz se entendeu. Se não entendeu, a dúvida vai para “Não compreendidas”.
        Use “Marcar como sanada” para as que você resolveu no plantão ao vivo.
      </p>

      <nav aria-label="Situação das dúvidas" className={styles.filtros}>
        {ABAS.map((a) => (
          <Link key={a.f} href={`/professor/duvidas?f=${a.f}`} aria-current={a.f === aba.f ? 'page' : undefined} className={`${styles.filtro} ${a.f === aba.f ? styles.filtroAtivo : ''}`}>
            {a.rotulo} · {contagem(a.status)}
          </Link>
        ))}
      </nav>

      {duvidas.length === 0 && <p className="suave" style={{ margin: 0 }}>Nenhuma dúvida nesta situação.</p>}

      {duvidas.map((d) => (
        <article key={d.id} className={`cartao ${styles.bloco}`} style={{ borderColor: d.status === 'nao_compreendida' ? 'var(--laranja)' : d.status === 'pendente' ? 'var(--ciano)' : undefined }}>
          <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <strong>{d.aluno?.nome || 'Aluno'}</strong>
              <span className="suave" style={{ fontSize: 14 }}>{d.contexto} · {quando(d.criada_em)}</span>
            </div>
            {d.status === 'nao_compreendida' && <span className={`${styles.chip} ${styles.chipAlerta}`}>Não entendeu a resposta</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.duvida_mensagens.map((m) => (
              <div key={m.id} style={{
                alignSelf: m.do_professor ? 'flex-end' : 'flex-start', maxWidth: 'min(680px, 100%)', padding: '10px 14px', borderRadius: 4,
                background: m.do_professor ? 'var(--ok-fundo)' : 'var(--cartao-2)', border: m.do_professor ? 'none' : '1px solid var(--destaque-borda)',
              }}>
                <span className="rotulo" style={{ fontSize: 10, color: m.do_professor ? 'var(--ok-texto)' : 'var(--ciano-texto)' }}>{m.do_professor ? 'Você' : 'Aluno'} · {quando(m.criada_em)}</span>
                <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.texto}</p>
              </div>
            ))}
          </div>
          {d.status !== 'sanada' && (
            <div className="linha-flex" style={{ alignItems: 'flex-end', gap: 12 }}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <Formulario acao={responderDuvida} botao={d.status === 'respondida' ? 'Complementar a resposta' : 'Responder'} limparAoEnviar>
                  <input type="hidden" name="duvida_id" value={d.id} />
                  <div className="campo">
                    <label htmlFor={`r-${d.id}`}>Sua resposta</label>
                    <textarea id={`r-${d.id}`} name="texto" rows={4} required maxLength={3000} placeholder="Explique o passo a passo. Pode colar o link de um vídeo curto." />
                  </div>
                </Formulario>
              </div>
              {d.status !== 'respondida' && (
                <Formulario acao={encerrarDuvida} botao="Marcar como sanada" classeBotao="btn btn-linha">
                  <input type="hidden" name="duvida_id" value={d.id} />
                </Formulario>
              )}
            </div>
          )}
        </article>
      ))}
    </>
  );
}
