'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { salvarQuestao, type Resultado } from '../actions';
import { enviarImagem } from '@/lib/upload';
import { BANCAS } from '@/lib/assuntos';
import styles from '../professor.module.css';
import { ImagemQuestao } from '@/components/ImagemQuestao';

export type QuestaoForm = {
  id?: string; codigo?: string; origem?: string; tipo?: string; banca?: string | null; orgao?: string | null; cargo?: string | null;
  ano?: number | null; escolaridade?: string | null; prova?: string | null; numero_prova?: number | null;
  disciplina?: string; assunto?: string | null; texto_base?: string | null; enunciado?: string;
  imagem?: string | null; alt_a?: string; alt_b?: string; alt_c?: string; alt_d?: string; alt_e?: string;
  nivel?: string | null; publicada?: boolean; revisada?: boolean; formato?: string;
  resposta?: string; comentario?: string | null; video_url?: string | null;
};

const caixa = { flex: 1, minWidth: 0, minHeight: 44, padding: '10px 12px', borderRadius: 12, background: 'var(--faixa)', color: 'var(--texto)', font: 'inherit', resize: 'vertical' as const };

export function FormQuestao({ q = {}, disciplinas, assuntos, proximaId }: {
  q?: QuestaoForm; disciplinas: string[]; assuntos: { disciplina: string; nome: string }[]; proximaId?: string | null;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Resultado>({});
  const [pendente, iniciar] = useTransition();
  const [origem, setOrigem] = useState(q.origem ?? 'prova');
  const [tipo, setTipo] = useState(q.tipo ?? 'multipla');
  const [disciplina, setDisciplina] = useState(q.disciplina ?? '');
  const [resposta, setResposta] = useState(q.resposta ?? '');
  const emImagem = q.formato === 'imagem';
  const ce = tipo === 'certo_errado';
  const sugestoesAssunto = assuntos.filter((a) => a.disciplina === disciplina).map((a) => a.nome);

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const seguir = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'seguir';
    if (seguir) dados.set('revisada', 'on');
    iniciar(async () => {
      setEstado({});
      try {
        const img = dados.get('imagem');
        if (img instanceof File && img.size > 0) dados.set('imagem_path', await enviarImagem('questoes', img));
        dados.delete('imagem');
        const r = await salvarQuestao({}, dados);
        setEstado(r);
        if (r.ok && !q.id) { form.reset(); setResposta(''); router.refresh(); }
        if (r.ok && q.id) { if (seguir && proximaId) router.push(`/professor/banco/${proximaId}`); else router.refresh(); }
      } catch (err) {
        setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar.' });
      }
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {q.id && <input type="hidden" name="id" value={q.id} />}
      <input type="hidden" name="formato" value={emImagem ? 'imagem' : 'texto'} />
      {emImagem && q.imagem && <ImagemQuestao src={q.imagem} alt={`Questão ${q.codigo}`} />}
      <datalist id="bancas">{BANCAS.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id="disciplinas">{disciplinas.map((d) => <option key={d} value={d} />)}</datalist>
      <datalist id="assuntos-disc">{sugestoesAssunto.map((a) => <option key={a} value={a} />)}</datalist>

      <div className={styles.campos}>
        <div className="campo">
          <label htmlFor="qtipo">Tipo</label>
          <select id="qtipo" name="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setResposta(''); }}>
            <option value="multipla">Múltipla escolha</option>
            <option value="certo_errado">Certo ou errado</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="qorig">Origem</label>
          <select id="qorig" name="origem" value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option value="prova">Prova oficial</option>
            <option value="autoral">Autoral</option>
          </select>
        </div>
        <div className="campo"><label htmlFor="qbanca">Banca{origem === 'autoral' ? ' (estilo)' : ''}</label><input id="qbanca" name="banca" list="bancas" maxLength={60} defaultValue={q.banca ?? ''} required={origem === 'prova'} /></div>
        {origem === 'prova' && (
          <>
            <div className="campo"><label htmlFor="qorgao">Órgão</label><input id="qorgao" name="orgao" maxLength={60} defaultValue={q.orgao ?? ''} placeholder="PM PE" required /></div>
            <div className="campo"><label htmlFor="qcargo">Cargo</label><input id="qcargo" name="cargo" maxLength={80} defaultValue={q.cargo ?? ''} placeholder="Soldado" /></div>
            <div className="campo"><label htmlFor="qano">Ano</label><input id="qano" name="ano" type="number" min={1990} max={2100} defaultValue={q.ano ?? ''} required /></div>
            <div className="campo">
              <label htmlFor="qesc">Escolaridade</label>
              <select id="qesc" name="escolaridade" defaultValue={q.escolaridade ?? ''}>
                <option value="">–</option><option value="fundamental">Fundamental</option><option value="medio">Médio</option><option value="superior">Superior</option>
              </select>
            </div>
            <div className="campo"><label htmlFor="qprova">Código da prova</label><input id="qprova" name="prova" maxLength={40} defaultValue={q.prova ?? ''} placeholder="AOCP-PMPE-2024-SD" className="mono" style={{ textTransform: 'uppercase' }} /></div>
            <div className="campo"><label htmlFor="qnum">Nº {ce ? 'do item' : 'da questão'} na prova</label><input id="qnum" name="numero_prova" type="number" min={1} max={300} defaultValue={q.numero_prova ?? ''} /></div>
          </>
        )}
        <div className="campo">
          <label htmlFor="qcod">Código (opcional)</label>
          <input id="qcod" name="codigo" type="text" defaultValue={q.codigo ?? ''} placeholder="Gerado sozinho se vazio" className="mono" style={{ textTransform: 'uppercase' }} />
        </div>
      </div>

      <div className={styles.campos}>
        <div className="campo"><label htmlFor="qdisc">Disciplina</label><input id="qdisc" name="disciplina" list="disciplinas" required maxLength={80} value={disciplina} onChange={(e) => setDisciplina(e.target.value)} /></div>
        <div className="campo"><label htmlFor="qass">Assunto</label><input id="qass" name="assunto" list="assuntos-disc" maxLength={120} defaultValue={q.assunto ?? ''} /></div>
        <div className="campo">
          <label htmlFor="qniv">Dificuldade</label>
          <select id="qniv" name="nivel" defaultValue={q.nivel ?? ''}>
            <option value="">–</option><option value="facil">Fácil</option><option value="medio">Médio</option><option value="dificil">Difícil</option>
          </select>
        </div>
        <div className="campo"><label htmlFor="qtb">Texto-base (código, opcional)</label><input id="qtb" name="texto_base" maxLength={40} defaultValue={q.texto_base ?? ''} placeholder="CB-PRF-2021-TB1" className="mono" style={{ textTransform: 'uppercase' }} /></div>
      </div>
      <span className="suave" style={{ fontSize: 13, marginTop: -6 }}>Disciplina ou assunto novo entra sozinho no catálogo. O texto-base é o texto comum a vários itens; ele é cadastrado pelo pacote importado.</span>

      <div className="campo">
        <label htmlFor="qenun">{emImagem ? 'Texto da questão (busca e leitores de tela)' : ce ? 'Item a julgar' : 'Enunciado'}</label>
        <textarea id="qenun" name="enunciado" rows={emImagem ? 3 : 7} required={!emImagem} defaultValue={q.enunciado ?? ''}
          placeholder="Parágrafos separados por linha em branco. Tabela: linhas | a | b |. Figura: [[fig:1]]." />
      </div>
      {!emImagem && <div className={styles.campos}>
        <div className="campo">
          <label htmlFor="qimg">Recorte da prova (opcional, botão “Ver na prova”)</label>
          <input id="qimg" name="imagem" type="file" accept="image/png,image/jpeg,image/webp" style={{ paddingBlock: 10 }} />
        </div>
        {q.imagem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <img src={q.imagem} alt="Recorte atual" style={{ maxHeight: 120, width: 'auto', borderRadius: 8, background: '#fff', alignSelf: 'flex-start' }} />
            <label className={styles.check}><input type="checkbox" name="remover_imagem" /> Remover o recorte</label>
          </div>
        )}
      </div>}

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>{ce ? 'Gabarito do item' : emImagem ? 'Alternativa certa' : 'Alternativas (marque a certa; deixe a E vazia se a prova tiver só A a D)'}</legend>
        {(ce || emImagem) && (
          <div className="linha-flex" role="radiogroup" aria-label="Resposta certa">
            {(ce ? [['C', 'Certo'], ['E', 'Errado']] : ['A', 'B', 'C', 'D', 'E'].map((L) => [L, L])).map(([L, nome]) => (
              <label key={L} className={styles.check} style={{ padding: '8px 14px', borderRadius: 12, border: `1.5px solid ${resposta === L ? 'var(--ciano)' : 'var(--linha-forte)'}` }}>
                <input type="radio" name="resposta" value={L} checked={resposta === L} onChange={() => setResposta(L)} required />
                <span>{nome}</span>
              </label>
            ))}
          </div>
        )}
        {!ce && !emImagem && (['A', 'B', 'C', 'D', 'E'] as const).map((L) => (
          <div key={L} className="linha-flex" style={{ flexWrap: 'nowrap', gap: 10 }}>
            <label className={styles.check} style={{ flex: '0 0 auto' }}>
              <input type="radio" name="resposta" value={L} checked={resposta === L} onChange={() => setResposta(L)} required aria-label={`Alternativa ${L} é a certa`} />
              <span className="mono" style={{ width: 18 }}>{L}</span>
            </label>
            <textarea name={`alt_${L.toLowerCase()}`} rows={1} defaultValue={(q[`alt_${L.toLowerCase()}` as 'alt_a'] as string) ?? ''} aria-label={`Texto da alternativa ${L}`}
              style={{ ...caixa, border: `1.5px solid ${resposta === L ? 'var(--ciano)' : 'var(--linha-forte)'}` }} />
          </div>
        ))}
      </fieldset>

      <div className="campo">
        <label htmlFor="qcom">Resolução comentada (o aluno vê depois de responder)</label>
        <textarea id="qcom" name="comentario" rows={6} defaultValue={q.comentario ?? ''} />
      </div>
      <div className="campo" style={{ maxWidth: 520 }}>
        <label htmlFor="qvid">Vídeo da resolução (opcional)</label>
        <input id="qvid" name="video_url" type="url" defaultValue={q.video_url ?? ''} placeholder="https://youtu.be/..." />
      </div>
      <label className={styles.check}><input type="checkbox" name="revisada" defaultChecked={q.revisada ?? !q.id} /> Revisada por mim (classificação, gabarito e resolução conferidos)</label>
      <label className={styles.check}><input type="checkbox" name="publicada" defaultChecked={q.publicada ?? true} /> Publicada para os alunos</label>

      <div className="linha-flex">
        <button className="btn btn-azul" value="salvar" disabled={pendente}>{pendente ? 'Salvando…' : q.id ? 'Salvar alterações' : 'Salvar questão'}</button>
        {q.id && proximaId && <button className="btn btn-ciano" value="seguir" disabled={pendente}>Revisada · ir para a próxima</button>}
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
