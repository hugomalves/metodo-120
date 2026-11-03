'use client';

import { useState, useTransition } from 'react';
import { responderQuestao, type Correcao } from '../../actions';
import { TextoAlternativa, TextoRico } from '@/components/TextoRico';

export type Alternativa = { letra: string; texto: string };
type Inicial = { resposta: string; comentario: string | null; video_url: string | null; minha_letra: string; acertou: boolean } | null;

type Historico = { vezes: number; acertos: number; ultima: boolean | null };

const ordinal = (n: number) => `${n}ª`;

function textoHistorico(h: Historico) {
  if (h.vezes === 1) return `Você já fez esta questão uma vez e ${h.ultima ? 'acertou' : 'errou'}.`;
  return `Você já fez esta questão ${h.vezes} vezes: acertou ${h.acertos} de ${h.vezes}. Na última, ${h.ultima ? 'acertou' : 'errou'}.`;
}

const NOME_CE: Record<string, string> = { C: 'Certo', E: 'Errado' };

export function ResponderQuestao({ questaoId, alternativas, certoErrado = false, inicial, figuras = [], taxa, lista = null, historico }: {
  questaoId: string; alternativas: Alternativa[]; certoErrado?: boolean; inicial: Inicial; figuras?: string[];
  taxa?: { respondidas: number; acertadas: number }; lista?: string | null; historico?: Historico;
}) {
  const [escolha, setEscolha] = useState<string>(inicial?.minha_letra ?? '');
  const [riscadas, setRiscadas] = useState<Set<string>>(new Set());
  const [correcao, setCorrecao] = useState<Correcao | null>(
    inicial ? { acertou: inicial.acertou, resposta: inicial.resposta, comentario: inicial.comentario, video_url: inicial.video_url, primeira: true, vezes: historico?.vezes || undefined, acertos: historico?.acertos } : null,
  );
  const [refazendo, setRefazendo] = useState(false);
  const [agora, setAgora] = useState(false);   // true quando a correção veio de uma resposta dada agora
  const [verResolucao, setVerResolucao] = useState(true);
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  const c = refazendo ? null : correcao;
  const soLetras = alternativas.every((a) => !a.texto.trim());

  const nomeResp = (l: string) => (certoErrado ? NOME_CE[l] ?? l : l);

  function responder() {
    if (!escolha) return setErro(certoErrado ? 'Marque Certo ou Errado.' : 'Escolha uma alternativa.');
    setErro('');
    iniciar(async () => {
      // dentro da lista vale a primeira resposta; "tentar de novo" vira treino
      const r = await responderQuestao(questaoId, escolha, refazendo || correcao ? null : lista);
      if (r.erro) return setErro(r.erro);
      if (r.correcao) { setCorrecao(r.correcao); setAgora(true); setRefazendo(false); setVerResolucao(true); }
    });
  }

  function riscar(letra: string) {
    setRiscadas((r) => { const n = new Set(r); if (n.has(letra)) n.delete(letra); else n.add(letra); return n; });
  }

  const pct = taxa && taxa.respondidas >= 5 ? Math.round((100 * taxa.acertadas) / taxa.respondidas) : null;
  const h = historico ?? { vezes: 0, acertos: 0, ultima: null };

  return (
    <div className="q-resposta">
      {!c && h.vezes > 0 && (
        <div className="q-historico" data-ultima={h.ultima ? 'certa' : 'errada'}>
          <span className="q-historico-icone" aria-hidden="true">{h.ultima ? '✓' : '✕'}</span>
          <span>{textoHistorico(h)}</span>
        </div>
      )}
      {certoErrado ? (
        <div className="q-ce" role="radiogroup" aria-label="Julgue o item">
          {alternativas.map((a) => {
            const marcada = escolha === a.letra;
            const estado = c ? (a.letra === c.resposta ? 'certa' : marcada ? 'errada' : '') : marcada ? 'marcada' : '';
            return (
              <button key={a.letra} type="button" role="radio" aria-checked={marcada} disabled={!!c} className="q-ce-botao"
                data-letra={a.letra} data-estado={estado} onClick={() => setEscolha(a.letra)}>
                <b aria-hidden="true">{a.letra}</b><span>{a.texto}</span>
              </button>
            );
          })}
        </div>
      ) : soLetras ? (
        <div className="q-marcar">
          <span className="q-marcar-titulo">{c ? 'Sua resposta' : 'Marque a alternativa'}</span>
          <div role="radiogroup" aria-label="Alternativas" className="q-marcar-letras">
            {alternativas.map((a) => {
              const marcada = escolha === a.letra;
              const estado = c ? (a.letra === c.resposta ? 'certa' : marcada ? 'errada' : '') : marcada ? 'marcada' : '';
              const riscada = riscadas.has(a.letra);
              return (
                <div key={a.letra} className="q-marcar-item">
                  <button type="button" role="radio" aria-checked={marcada} aria-label={`Alternativa ${a.letra}`} disabled={!!c}
                    className="q-marcar-letra" data-estado={estado} data-riscada={riscada ? 'sim' : undefined}
                    onClick={() => setEscolha(a.letra)}>{a.letra}</button>
                  {!c && (
                    <button type="button" className="q-marcar-riscar" onClick={() => riscar(a.letra)}
                      aria-label={`${riscada ? 'Desfazer o risco da' : 'Riscar a'} alternativa ${a.letra}`}>
                      {riscada ? 'desfazer' : 'riscar'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <div role="radiogroup" aria-label="Alternativas" className="q-alts">
        {alternativas.map((a) => {
          const marcada = escolha === a.letra;
          const estado = c
            ? a.letra === c.resposta ? 'certa' : marcada ? 'errada' : ''
            : marcada ? 'marcada' : '';
          return (
            <div key={a.letra} className="q-alt" data-estado={estado} data-riscada={riscadas.has(a.letra) ? 'sim' : undefined}>
              <button type="button" role="radio" aria-checked={marcada} disabled={!!c} onClick={() => setEscolha(a.letra)} className="q-alt-botao">
                <b className="q-letra">{a.letra}</b>
                <span className="q-alt-texto"><TextoAlternativa texto={a.texto} figuras={figuras} /></span>
              </button>
              {!c && (
                <button type="button" className="q-riscar" onClick={() => riscar(a.letra)} title={riscadas.has(a.letra) ? 'Desfazer o risco' : 'Riscar esta alternativa'}
                  aria-label={`${riscadas.has(a.letra) ? 'Desfazer o risco da' : 'Riscar a'} alternativa ${a.letra}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}

      {!c ? (
        <div className="linha-flex">
          <button className="q-resolver" onClick={responder} disabled={pendente}>{pendente ? 'Corrigindo…' : certoErrado ? 'Corrigir item' : 'Resolver questão'}</button>
          {certoErrado && <span className="suave" style={{ fontSize: 13.5 }}>Na prova, cada item errado anula um certo. Na dúvida, deixar em branco também é uma opção.</span>}
          {erro && <span role="alert" className="erro">{erro}{/grátis/.test(erro) && <> <a href="/aluno/planos" style={{ fontWeight: 700 }}>Ver planos</a></>}</span>}
        </div>
      ) : (
        <section aria-live="polite" className="q-resultado" data-acertou={c.acertou ? 'sim' : 'nao'}>
          <div className="q-resultado-topo">
            <strong>{c.acertou ? `Você acertou! Gabarito: ${nomeResp(c.resposta)}` : `Você errou. Gabarito: ${nomeResp(c.resposta)}`}</strong>
            {pct !== null && !c.vezes && <span className="suave" style={{ fontSize: 14 }}>{pct}% dos alunos acertaram</span>}
          </div>
          {c.vezes ? (
            <div className="q-miniestat" aria-label="Seu histórico nesta questão">
              {agora ? <span><b>{ordinal(c.vezes)}</b> tentativa</span> : <span><b>{c.vezes}</b> {c.vezes === 1 ? 'tentativa' : 'tentativas'}</span>}
              <span><b>{c.acertos ?? 0} de {c.vezes}</b> acertos seus</span>
              {pct !== null && <span><b>{pct}%</b> dos alunos acertam</span>}
            </div>
          ) : null}
          {c.comentario ? (
            <div className="q-resolucao">
              <button type="button" className="q-link" onClick={() => setVerResolucao((v) => !v)} aria-expanded={verResolucao}>
                {verResolucao ? 'Esconder a resolução comentada' : 'Ver a resolução comentada'}
              </button>
              {verResolucao && <div className="q-resolucao-texto"><TextoRico texto={c.comentario} /></div>}
            </div>
          ) : (
            <span className="suave" style={{ fontSize: 14 }}>A resolução comentada desta questão será publicada em breve.</span>
          )}
          <div className="linha-flex">
            {c.video_url && <a href={c.video_url} target="_blank" rel="noopener" className="btn btn-linha">Resolução em vídeo</a>}
            <button className="btn btn-linha" onClick={() => { setRefazendo(true); setEscolha(''); setRiscadas(new Set()); }}>Tentar de novo</button>
          </div>
        </section>
      )}
    </div>
  );
}
