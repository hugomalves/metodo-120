import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NIVEIS } from '@/lib/assuntos';
import { agrupar, type QuestaoCritica } from '@/lib/criticas';
import { publicarRecado } from './actions';
import { FormAcao } from './FormAcao';
import styles from './professor.module.css';

export const metadata = { title: 'Painel do professor' };

type Resumo = { alunos_ativos: number; estudaram_semana: number; sem_estudar_7d: number };
type Ultima = { id: string; contexto: string; criada_em: string; aluno: { nome: string } | null; duvida_mensagens: { texto: string }[] };

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export default async function VisaoGeral() {
  const supabase = await createClient();

  const [{ data: resumoRows }, { data: turmas }, { data: ultimoRecado }, { data: status }, { data: ultimas }, { data: criticasRaw }] = await Promise.all([
    supabase.rpc('professor_resumo'),
    supabase.from('turmas').select('id, nome').order('inicio', { ascending: false }),
    supabase.from('recados').select('texto, publicado_em').order('publicado_em', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('duvidas').select('status'),
    supabase.from('duvidas').select('id, contexto, criada_em, aluno:perfis(nome), duvida_mensagens(texto)')
      .in('status', ['pendente', 'nao_compreendida']).order('atualizada_em')
      .order('criada_em', { referencedTable: 'duvida_mensagens', ascending: false }).limit(3),
    supabase.rpc('professor_questoes_criticas', { p_turma: null, p_simulado: null, p_limite: 8 }),
  ]);

  const resumo = ((resumoRows as Resumo[] | null) ?? [])[0] ?? { alunos_ativos: 0, estudaram_semana: 0, sem_estudar_7d: 0 };
  const st = ((status ?? []) as { status: string }[]).map((d) => d.status);
  const pendentes = st.filter((x) => x === 'pendente').length;
  const naoEntendidas = st.filter((x) => x === 'nao_compreendida').length;
  const sanadas = st.filter((x) => x === 'sanada' || x === 'respondida').length;
  const proximas = (ultimas ?? []) as unknown as Ultima[];
  const grupos = agrupar((criticasRaw ?? []) as QuestaoCritica[]).slice(0, 4);

  return (
    <>
      <h1 className={`display ${styles.titulo}`}>Visão geral</h1>

      <Link href="/professor/duvidas" className={`cartao ${styles.bloco}`} style={{ textDecoration: 'none', color: 'var(--texto)', borderColor: pendentes + naoEntendidas ? 'var(--ciano)' : undefined }}>
        <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
          <h2 className="display">Plantão de dúvidas</h2>
          <span className="btn btn-linha" style={{ minHeight: 36, fontSize: 14 }}>Abrir o plantão</span>
        </div>
        <div className={styles.numeros}>
          <div className={styles.numero} style={{ padding: 0 }}><small>Pendentes</small><b style={{ color: pendentes ? 'var(--ciano)' : undefined }}>{pendentes}</b></div>
          <div className={styles.numero} style={{ padding: 0 }}><small>Não compreendidas</small><b style={{ color: naoEntendidas ? 'var(--laranja)' : undefined }}>{naoEntendidas}</b></div>
          <div className={styles.numero} style={{ padding: 0 }}><small>Sanadas ou respondidas</small><b>{sanadas}</b></div>
        </div>
        {proximas.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {proximas.map((d) => (
              <div key={d.id} style={{ borderTop: '1px solid var(--linha)', paddingTop: 8 }}>
                <span className="suave" style={{ fontSize: 13 }}>{d.aluno?.nome || 'Aluno'} · {d.contexto}</span>
                <p style={{ margin: '2px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.duvida_mensagens?.[0]?.texto}</p>
              </div>
            ))}
          </div>
        ) : (
          <span className="suave">Nenhuma dúvida esperando resposta.</span>
        )}
      </Link>

      <section aria-label="Engajamento do curso" className={styles.numeros}>
        <div className={`cartao ${styles.numero}`}><small>Alunos com acesso</small><b>{resumo.alunos_ativos}</b></div>
        <Link href="/professor/engajamento" className={`cartao ${styles.numero}`} style={{ textDecoration: 'none', color: 'var(--texto)' }}>
          <small>Estudaram esta semana</small>
          <b>{pct(resumo.estudaram_semana, resumo.alunos_ativos)}%</b>
          <span className="suave" style={{ fontSize: 14 }}>{resumo.estudaram_semana} de {resumo.alunos_ativos} alunos · ver por turma</span>
        </Link>
        <Link href="/professor/engajamento" className={`cartao ${styles.numero}`} style={{ textDecoration: 'none', color: 'var(--texto)', borderColor: resumo.sem_estudar_7d ? 'var(--laranja)' : undefined }}>
          <small>Sem estudar há 7+ dias</small>
          <b>{pct(resumo.sem_estudar_7d, resumo.alunos_ativos)}%</b>
          <span className="suave" style={{ fontSize: 14 }}>{resumo.sem_estudar_7d} de {resumo.alunos_ativos} alunos · ver por turma</span>
        </Link>
      </section>

      <section aria-labelledby="derrubaram" className={`cartao ${styles.bloco}`}>
        <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
          <h2 id="derrubaram" className="display">Questões que mais derrubam</h2>
          <Link href="/professor/questoes-criticas" className="btn btn-linha" style={{ minHeight: 36, fontSize: 14 }}>Ver as 20, por turma</Link>
        </div>
        {grupos.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Quando os alunos enviarem o primeiro cartão-resposta, a pauta da correção ao vivo aparece aqui.</p>
        ) : (
          grupos.map((g) => (
            <div key={g.chave} className="linha-flex" style={{ borderTop: '1px solid var(--linha)', paddingTop: 10, alignItems: 'baseline' }}>
              <strong style={{ flex: '0 1 280px', minWidth: 0 }}>{g.assunto ?? 'Sem assunto'}{g.habilidade ? ` · ${g.habilidade}` : ''}</strong>
              <span className="suave" style={{ flex: '1 1 300px', minWidth: 0, fontSize: 14 }}>
                {g.questoes.map((q) => `${q.codigo} Q${q.questao} (${Number(q.pct_erro)}%${q.nivel ? `, ${NIVEIS[q.nivel].toLowerCase()}` : ''})`).join(' · ')}
              </span>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="recado" className={`cartao ${styles.bloco}`}>
        <h2 id="recado" className="display">Recado da semana</h2>
        {ultimoRecado && (
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>Último publicado: “{ultimoRecado.texto}”</p>
        )}
        <FormAcao acao={publicarRecado} botao="Publicar recado">
          <div className="campo">
            <label htmlFor="texto">Texto (até 140 caracteres, aparece no topo da página do aluno)</label>
            <textarea id="texto" name="texto" maxLength={140} rows={3} required />
          </div>
          <div className={styles.campos}>
            <div className="campo">
              <label htmlFor="video">Vídeo (opcional)</label>
              <input id="video" name="video" type="url" placeholder="Link do YouTube" />
            </div>
            <div className="campo">
              <label htmlFor="turma">Para qual turma</label>
              <select id="turma" name="turma" defaultValue="">
                <option value="">Todas as turmas</option>
                {((turmas ?? []) as { id: string; nome: string }[]).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>
        </FormAcao>
      </section>
    </>
  );
}
