'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TextoAlternativa, TextoRico } from '@/components/TextoRico';
import { entregarProva, salvarProva } from '../../actions';

export type QuestaoProva = {
  id: string; disciplina: string; origem: string; enunciado: string; figuras: string[];
  textoBase: { id: string; texto: string; figuras: string[] } | null; alternativas: { letra: string; texto: string }[];
};

const hm = (seg: number) => {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${h ? `${h}h ` : ''}${String(m).padStart(2, '0')}min ${String(r).padStart(2, '0')}s`;
};

// O aluno marca as respostas (salvas sozinhas enquanto faz) e entrega no fim; a correção só aparece depois
export function FazerProva({ provaId, questoes, inicial, inicio, duracaoMin }: {
  provaId: string; questoes: QuestaoProva[]; inicial: string; inicio: string; duracaoMin: number | null;
}) {
  const router = useRouter();
  const [resp, setResp] = useState<string[]>(() => Array.from({ length: questoes.length }, (_, i) => inicial[i] ?? '-'));
  const [agora, setAgora] = useState<number | null>(null);   // só no navegador (evita diferença com o servidor)
  const [salvo, setSalvo] = useState<'salvo' | 'salvando' | 'erro'>('salvo');
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setAgora(Date.now()); const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t); }, []);
  const decorrido = agora === null ? 0 : (agora - new Date(inicio).getTime()) / 1000;
  const restante = duracaoMin ? duracaoMin * 60 - decorrido : null;
  const feitas = resp.filter((r) => r !== '-').length;

  // separa as questões por disciplina (para o mapa de navegação)
  const grupos = useMemo(() => {
    const g: { disciplina: string; idx: number[] }[] = [];
    questoes.forEach((q, i) => { const ult = g[g.length - 1]; if (ult?.disciplina === q.disciplina) ult.idx.push(i); else g.push({ disciplina: q.disciplina, idx: [i] }); });
    return g;
  }, [questoes]);

  function marcar(i: number, letra: string) {
    setResp((r) => {
      const n = [...r]; n[i] = n[i] === letra ? '-' : letra;
      setSalvo('salvando');
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(async () => {
        const res = await salvarProva(provaId, n.join(''));
        setSalvo(res.erro ? 'erro' : 'salvo');
      }, 1200);
      return n;
    });
  }

  function entregar() {
    const brancos = resp.filter((r) => r === '-').length;
    const aviso = brancos ? `Você deixou ${brancos} ${brancos === 1 ? 'questão' : 'questões'} em branco. ` : '';
    if (!window.confirm(`${aviso}Entregar o simulado? Depois de entregar não dá para mudar as respostas.`)) return;
    setErro('');
    iniciar(async () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      const r = await entregarProva(provaId, resp.join(''));
      if (r.erro) return setErro(r.erro);
      router.refresh();
      window.scrollTo({ top: 0 });
    });
  }

  let anteriorTexto: string | null = null;
  return (
    <div className="pv">
      <div className="pv-barra" role="region" aria-label="Andamento do simulado">
        <span className="pv-tempo" data-alerta={restante !== null && restante < 600 ? 'sim' : undefined}>
          {agora === null ? <>Tempo <b>…</b></> : restante !== null ? <>Faltam <b>{hm(restante)}</b></> : <>Tempo <b>{hm(decorrido)}</b></>}
        </span>
        <span><b>{feitas}</b> de {questoes.length} marcadas</span>
        <span className="pv-salvo" aria-live="polite">{salvo === 'salvando' ? 'Salvando…' : salvo === 'erro' ? 'Não salvou: confira a internet' : 'Respostas salvas'}</span>
        <button className="btn btn-azul" onClick={entregar} disabled={pendente}>{pendente ? 'Corrigindo…' : 'Entregar o simulado'}</button>
      </div>
      {erro && <p role="alert" className="erro" style={{ margin: 0 }}>{erro}</p>}

      <nav className="pv-mapa" aria-label="Ir para a questão">
        {grupos.map((g) => (
          <div key={g.disciplina + g.idx[0]} className="pv-mapa-grupo">
            <span>{g.disciplina}</span>
            <div>
              {g.idx.map((i) => (
                <a key={i} href={`#pq-${i + 1}`} data-feita={resp[i] !== '-' ? 'sim' : undefined} aria-label={`Questão ${i + 1}${resp[i] !== '-' ? `, marcada ${resp[i]}` : ', em branco'}`}>{i + 1}</a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {questoes.map((q, i) => {
        const mostrarTexto = q.textoBase && q.textoBase.id !== anteriorTexto;
        anteriorTexto = q.textoBase?.id ?? null;
        const inicioDisc = i === 0 || questoes[i - 1].disciplina !== q.disciplina;
        return (
          <div key={q.id}>
            {inicioDisc && <h2 className="pv-disciplina display">{q.disciplina}</h2>}
            <article id={`pq-${i + 1}`} className="q-cartao">
              <header className="q-cabeca">
                <div style={{ minWidth: 0 }}>
                  <span className="q-num">Questão {i + 1} de {questoes.length}</span>
                  <span className="q-origem">{q.origem}</span>
                </div>
              </header>
              <div className="q-corpo">
                {mostrarTexto && q.textoBase && <div className="q-texto-base"><TextoRico texto={q.textoBase.texto} figuras={q.textoBase.figuras} /></div>}
                <TextoRico texto={q.enunciado} figuras={q.figuras} />
                <div role="radiogroup" aria-label={`Alternativas da questão ${i + 1}`} className="q-alts">
                  {q.alternativas.map((a) => (
                    <div key={a.letra} className="q-alt" data-estado={resp[i] === a.letra ? 'marcada' : ''}>
                      <button type="button" role="radio" aria-checked={resp[i] === a.letra} className="q-alt-botao" onClick={() => marcar(i, a.letra)}>
                        <b className="q-letra">{a.letra}</b>
                        <span className="q-alt-texto">{a.texto ? <TextoAlternativa texto={a.texto} figuras={q.figuras} /> : null}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        );
      })}

      <div className="linha-flex" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-azul btn-grande" onClick={entregar} disabled={pendente}>{pendente ? 'Corrigindo…' : 'Entregar o simulado'}</button>
      </div>
    </div>
  );
}
