'use client';

import { useEffect, useMemo, useState } from 'react';
import s from './landing.module.css';

// ---------- O dia de 120 minutos (rosca com os 3 blocos) ----------
const BLOCOS = [
  { nome: 'Bloco 1', min: 50, cor: '#0B5CFF', titulo: 'Aula + questões do assunto do dia', texto: 'Uma aula curta e direta do assunto que mais cai, seguida de questões sobre ele. Você aprende e já testa, sem acumular teoria sem treino.' },
  { nome: 'Bloco 2', min: 50, cor: '#38A9FF', titulo: 'Questões da sua banca', texto: 'Questões no estilo da banca do seu concurso, de outra disciplina do edital. É aqui que você ganha ritmo de prova.' },
  { nome: 'Bloco 3', min: 20, cor: '#2FD39A', titulo: 'Caderno de erros', texto: 'Você refaz as questões que errou nos dias anteriores. Os últimos 20 minutos garantem que o que você estudou continue vivo até a prova.' },
];

export function DiaDe120() {
  const [ativo, setAtivo] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [minuto, setMinuto] = useState(0);

  // "ver um dia em 12 segundos": 120 minutos passam em 12 s
  useEffect(() => {
    if (!tocando) return;
    if (minuto >= 120) { setTocando(false); return; }
    const t = setTimeout(() => setMinuto((m) => m + 1), 100);
    return () => clearTimeout(t);
  }, [tocando, minuto]);
  useEffect(() => { if (tocando) setAtivo(minuto < 50 ? 0 : minuto < 100 ? 1 : 2); }, [minuto, tocando]);

  const R = 80, C = 2 * Math.PI * R;
  let acumulado = 0;
  const b = BLOCOS[ativo];
  return (
    <div className={s.dia}>
      <div className={s.rosca}>
        <svg viewBox="0 0 200 200" role="img" aria-label="120 minutos por dia: 50 de aula e questões, 50 de questões da banca e 20 de caderno de erros">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--cartao-2)" strokeWidth="22" />
          {BLOCOS.map((x, i) => {
            const len = (x.min / 120) * C;
            const el = (
              <circle key={x.nome} cx="100" cy="100" r={R} fill="none" stroke={x.cor} strokeWidth={ativo === i ? 28 : 22}
                strokeDasharray={`${len - 3} ${C - len + 3}`} strokeDashoffset={-acumulado} transform="rotate(-90 100 100)"
                style={{ cursor: 'pointer', transition: 'stroke-width .2s', opacity: tocando && minuto < acumulado / C * 120 ? 0.25 : 1 }}
                onClick={() => { setTocando(false); setAtivo(i); }} />
            );
            acumulado += len;
            return el;
          })}
          {tocando && <circle cx="100" cy="100" r={R} fill="none" stroke="#071A3D" strokeWidth="4" strokeDasharray={`2 ${C}`} strokeDashoffset={-(minuto / 120) * C} transform="rotate(-90 100 100)" />}
        </svg>
        <div className={s.roscaCentro}>
          <b>{tocando ? minuto : 120}</b>
          <span>{tocando ? 'minutos' : 'minutos por dia'}</span>
        </div>
      </div>
      <div className={s.diaLado}>
        <div className={s.abas} role="tablist" aria-label="Blocos do dia">
          {BLOCOS.map((x, i) => (
            <button key={x.nome} role="tab" aria-selected={ativo === i} className={s.aba} data-ativo={ativo === i ? 'sim' : undefined}
              onClick={() => { setTocando(false); setAtivo(i); }}>
              <span className={s.bolinha} style={{ background: x.cor }} />{x.nome} · {x.min} min
            </button>
          ))}
        </div>
        <div className={s.blocoInfo} role="tabpanel">
          <h3 className="display">{b.titulo}</h3>
          <p>{b.texto}</p>
        </div>
        <button className="btn btn-linha" onClick={() => { setMinuto(0); setTocando(true); }} disabled={tocando}>
          {tocando ? `Minuto ${minuto} de 120…` : '▶ Ver um dia inteiro em 12 segundos'}
        </button>
      </div>
    </div>
  );
}

// ---------- Os 12 meses em 3 fases ----------
const FASES = [
  {
    nome: 'Fase 1', titulo: 'Base: o que mais cai',
    texto: 'Você começa pelos assuntos que mais aparecem nas provas da sua banca. Os primeiros meses já rendem pontos de verdade.',
    blocos: ['Aula completa de um assunto muito cobrado', 'Questões da banca sobre esses assuntos', 'Caderno de erros'],
    simulados: 'Minissimulado todo domingo, para medir a evolução desde a primeira semana.',
    revisao: 'Os assuntos estudados voltam em questões nos dias seguintes, antes de você esquecer.',
  },
  {
    nome: 'Fase 2', titulo: 'Ampliação: o que cai com frequência média',
    texto: 'Com a base firme, entram os assuntos de frequência média. O que você já estudou continua aparecendo nas questões, para não se perder.',
    blocos: ['Aula de um assunto de frequência média', 'Questões misturando a Fase 1 e a Fase 2', 'Caderno de erros'],
    simulados: 'Minissimulado semanal e simulados completos no formato da prova.',
    revisao: 'Revisão por questões de tudo o que já foi visto, priorizando os seus erros.',
  },
  {
    nome: 'Fase 3', titulo: 'Fechamento: o que cai menos e a revisão geral',
    texto: 'Os assuntos menos cobrados entram em versão enxuta, com resumo e questões. O resto do tempo é revisão geral, para você chegar na prova com o edital inteiro fresco.',
    blocos: ['Aula enxuta de um assunto que cai menos', 'Revisão geral por questões, de todo o edital', 'Caderno de erros'],
    simulados: 'Simulados completos no padrão da banca, com a regra de corte do edital e correção comentada.',
    revisao: 'Revisão geral de todas as fases, priorizando os seus erros.',
  },
];

export function Fases() {
  const [f, setF] = useState(0);
  const x = FASES[f];
  return (
    <div className={s.fases}>
      <div className={s.linhaTempo} role="tablist" aria-label="Fases do plano">
        {FASES.map((y, i) => (
          <button key={y.nome} role="tab" aria-selected={f === i} className={s.fase} data-ativo={f === i ? 'sim' : undefined} onClick={() => setF(i)}>
            <b>{y.nome}</b><span>{y.titulo.split(':')[0]}</span>
          </button>
        ))}
      </div>
      <div className={s.faseInfo} role="tabpanel">
        <h3 className="display">{x.nome}: {x.titulo.split(': ')[1]}</h3>
        <p>{x.texto}</p>
        <ol className={s.faseBlocos}>
          {x.blocos.map((t, i) => <li key={t}><span className={s.bolinha} style={{ background: BLOCOS[i].cor }} /><b>Bloco {i + 1}</b> {t}</li>)}
        </ol>
        <div className={s.faseExtras}>
          <div><b>Simulados</b><span>{x.simulados}</span></div>
          <div><b>Revisões</b><span>{x.revisao}</span></div>
        </div>
      </div>
    </div>
  );
}

// ---------- Quando você começa? ----------
export function Calculadora() {
  const [inicio, setInicio] = useState('');
  useEffect(() => { setInicio(new Date().toISOString().slice(0, 10)); }, []);
  const fim = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return null;
    const d = new Date(inicio + 'T12:00:00');
    d.setDate(d.getDate() + 364);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [inicio]);
  return (
    <div className={s.calc}>
      <label htmlFor="lc-inicio"><b>Quando você começa?</b></label>
      <input id="lc-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
      {fim && <p>Seu plano vai até <b>{fim}</b>: 365 dias e <b>730 horas</b> de estudo, 2 horas por dia.</p>}
    </div>
  );
}

// ---------- Minissimulado de 3 questões ----------
const QUIZ = [
  {
    disc: 'Raciocínio Lógico',
    enunciado: '“Se o candidato estuda 120 minutos por dia, então ele evolui.” Essa proposição é falsa quando o candidato:',
    alts: ['não estuda e evolui.', 'não estuda e não evolui.', 'estuda e evolui.', 'estuda e não evolui.', 'evolui, mesmo estudando menos de 120 minutos.'],
    certa: 3,
    porque: 'Uma condicional “se P, então Q” só é falsa quando P é verdadeira e Q é falsa: ele estuda os 120 minutos e, mesmo assim, não evolui.',
  },
  {
    disc: 'Língua Portuguesa',
    enunciado: 'Assinale a frase que está de acordo com a norma-padrão quanto à concordância.',
    alts: ['Fazem dois anos que me inscrevi no concurso.', 'Houveram muitas inscrições no último dia.', 'Existem muitos candidatos para cada vaga.', 'Faltou dez minutos para terminar a prova.', 'Vende-se apostilas usadas.'],
    certa: 2,
    porque: '“Existir” concorda com o sujeito: muitos candidatos existem. “Fazer” indicando tempo e “haver” no sentido de existir ficam no singular; “faltaram dez minutos”; “vendem-se apostilas”.',
  },
  {
    disc: 'Matemática',
    enunciado: 'Um candidato estuda 2 horas por dia, todos os dias, durante 1 ano de 365 dias. Quantas horas de estudo ele acumula?',
    alts: ['365 horas', '600 horas', '730 horas', '1.000 horas', '1.200 horas'],
    certa: 2,
    porque: '2 horas × 365 dias = 730 horas. É mais do que muita gente estuda em anos tentando sem plano.',
  },
];

export function MiniQuiz({ ctaHref }: { ctaHref: string }) {
  const [q, setQ] = useState(0);
  const [marcada, setMarcada] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);
  const atual = QUIZ[q];
  const respondida = marcada !== null;

  if (fim) {
    return (
      <div className={s.quiz}>
        <h3 className="display">Você acertou {acertos} de {QUIZ.length}</h3>
        <p>É assim todos os dias no Método 120: questões no estilo da banca, com a explicação logo depois. Crie a sua conta grátis e resolva questões de verdade das provas.</p>
        <div className="linha-flex">
          <a href={ctaHref} className="btn btn-azul">Criar conta grátis</a>
          <button className="btn btn-linha" onClick={() => { setQ(0); setMarcada(null); setAcertos(0); setFim(false); }}>Refazer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.quiz}>
      <span className={s.quizTopo}>Questão {q + 1} de {QUIZ.length} · {atual.disc}</span>
      <p className={s.quizEnunciado}>{atual.enunciado}</p>
      <div className={s.quizAlts}>
        {atual.alts.map((a, i) => {
          const estado = !respondida ? '' : i === atual.certa ? 'certa' : i === marcada ? 'errada' : '';
          return (
            <button key={i} className={s.quizAlt} data-estado={estado} disabled={respondida}
              onClick={() => { setMarcada(i); if (i === atual.certa) setAcertos((n) => n + 1); }}>
              <b>{'ABCDE'[i]}</b><span>{a}</span>
            </button>
          );
        })}
      </div>
      {respondida && (
        <div className={s.quizPorque} data-ok={marcada === atual.certa ? 'sim' : 'nao'}>
          <b>{marcada === atual.certa ? 'Acertou!' : `Resposta certa: ${'ABCDE'[atual.certa]}`}</b>
          <p>{atual.porque}</p>
          <button className="btn btn-azul" onClick={() => { if (q + 1 < QUIZ.length) { setQ(q + 1); setMarcada(null); } else setFim(true); }}>
            {q + 1 < QUIZ.length ? 'Próxima questão' : 'Ver resultado'}
          </button>
        </div>
      )}
    </div>
  );
}
