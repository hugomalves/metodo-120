'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { Formulario } from '@/components/Formulario';
import { criarCaderno } from '../acoes';
import { juntar, lista, mapaEditais, passa, valor, CHAVES, VAZIO, type Chave, type EditalFiltro, type Grupo, type ValoresFiltro } from '@/lib/filtros';
import { arvoreDaDisciplina, marca, nomesDoNo, passaM, selecaoDe, type LinhaAssunto, type No } from '@/lib/arvoreAssuntos';
import { NIVEIS, TIPOS } from '@/lib/assuntos';
import { pastasEmOrdem, recuo, type Pasta } from '@/lib/pastas';
import { IconePasta, SetaAzul, SetaVerde } from '../Icones';
import s from '../banco.module.css';

type Aba = 'edital' | 'materia' | 'banca' | 'orgao' | 'ano' | 'opcoes';
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'materia', rotulo: 'Matéria e assunto' },
  { id: 'edital', rotulo: 'Edital' },
  { id: 'banca', rotulo: 'Banca' },
  { id: 'orgao', rotulo: 'Órgão e cargo' },
  { id: 'ano', rotulo: 'Ano' },
  { id: 'opcoes', rotulo: 'Opções' },
];
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export type Inicial = Partial<ValoresFiltro> & { m?: string; novas?: boolean };

// Tela "Filtrar questões": abas de filtros, árvore de matérias e assuntos, contagem ao vivo e criação do caderno
export function FiltrarQuestoes({ grupos, editais, assuntos, pastas, inicial, maxQtd, completo }: {
  grupos: Grupo[]; editais: EditalFiltro[]; assuntos: LinhaAssunto[]; pastas: Pasta[]; inicial: Inicial; maxQtd: number; completo: boolean;
}) {
  const mapa = useMemo(() => mapaEditais(editais), [editais]);
  const [f, setF] = useState<ValoresFiltro>({ ...VAZIO, ...Object.fromEntries(CHAVES.map((k) => [k, inicial[k] ?? '']).filter(([, v]) => v)) });
  const [m, setM] = useState<string[]>(inicial.m ? inicial.m.split('|').filter(Boolean) : []);
  const [novas, setNovas] = useState(!!inicial.novas);
  const [aba, setAba] = useState<Aba>('materia');
  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [gaveta, setGaveta] = useState(false);
  const [modal, setModal] = useState(false);

  const usados = useMemo(() => {
    const x = new Map<string, Set<string>>();
    grupos.forEach((g) => { if (g.disciplina && g.assunto) x.set(g.disciplina, (x.get(g.disciplina) ?? new Set()).add(g.assunto)); });
    return new Map(Array.from(x.entries()).map(([d, v]) => [d, Array.from(v)]));
  }, [grupos]);
  const sel = useMemo(() => selecaoDe(m, assuntos, usados), [m, assuntos, usados]);

  const passaG = (g: Grupo, ignorar?: Chave | 'm') => {
    if (novas && g.feita) return false;
    if (CHAVES.some((k) => k !== ignorar && !passa(g, k, f[k], mapa))) return false;
    return ignorar === 'm' || passaM(sel, g.disciplina, g.assunto);
  };
  const total = useMemo(() => grupos.reduce((t, g) => (passaG(g) ? t + g.n : t), 0), [grupos, f, m, novas]); // eslint-disable-line react-hooks/exhaustive-deps

  // contagem de cada opção, respeitando os outros filtros
  const opcoes = (k: Chave) => {
    const c = new Map<string, number>();
    grupos.forEach((g) => { if (!passaG(g, k)) return; const v = valor(g, k); if (v) c.set(v, (c.get(v) ?? 0) + g.n); });
    return c;
  };
  const alterna = (k: Chave, v: string) => setF((x) => {
    const cur = lista(x[k]);
    return { ...x, [k]: juntar(cur.includes(v) ? cur.filter((y) => y !== v) : [...cur, v]) };
  });

  // contagens da árvore (todos os filtros, menos a própria árvore)
  const { porDisc, porAss } = useMemo(() => {
    const pd = new Map<string, number>(); const pa = new Map<string, Map<string, number>>();
    grupos.forEach((g) => {
      if (!passaG(g, 'm') || !g.disciplina) return;
      pd.set(g.disciplina, (pd.get(g.disciplina) ?? 0) + g.n);
      if (g.assunto) { const mm = pa.get(g.disciplina) ?? new Map(); mm.set(g.assunto, (mm.get(g.assunto) ?? 0) + g.n); pa.set(g.disciplina, mm); }
    });
    return { porDisc: pd, porAss: pa };
  }, [grupos, f, novas]); // eslint-disable-line react-hooks/exhaustive-deps

  const disciplinas = useMemo(() => {
    const nomes = new Set<string>(); grupos.forEach((g) => g.disciplina && nomes.add(g.disciplina));
    return Array.from(nomes).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [grupos]);

  const alternaM = (t: string) => setM((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const alternaAberto = (id: string) => setAbertos((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const q = norm(busca.trim());
  const casa = (nome: string) => !q || norm(nome).includes(q);

  const contaNo = (d: string, no: No) => nomesDoNo(no).reduce((t, n) => t + (porAss.get(d)?.get(n) ?? 0), 0);
  const temCasa = (d: string, no: No): boolean => casa(no.nome) || no.filhos.some((x) => temCasa(d, x));

  function Linha({ d, no, nivel }: { d: string; no: No; nivel: number }): React.ReactNode {
    const n = contaNo(d, no);
    const t = marca(d, no.nome);
    if (n === 0 && !m.includes(t)) return null;
    if (q && !temCasa(d, no)) return null;
    const pasta = no.filhos.length > 0;
    const aberto = !!q || abertos.has(`${d}>${no.id}`);
    return (
      <>
        <li style={{ paddingLeft: 12 + nivel * 18 }} className={s.arvLinha} data-marcada={m.includes(t) || undefined}>
          {pasta ? (
            <button type="button" className={s.arvBotao} aria-expanded={aberto} onClick={() => alternaAberto(`${d}>${no.id}`)}>
              <IconePasta aberta={aberto} /><span className={s.arvNome}>{no.nome}</span><span className={s.arvN}>{n}</span>
            </button>
          ) : (
            <button type="button" className={s.arvBotao} aria-pressed={m.includes(t)} onClick={() => alternaM(t)}>
              <SetaVerde /><span className={s.arvNome}>{no.nome}</span><span className={s.arvN}>{n}</span>
            </button>
          )}
        </li>
        {pasta && aberto && (
          <>
            <li style={{ paddingLeft: 30 + nivel * 18 }} className={s.arvLinha} data-marcada={m.includes(t) || undefined}>
              <button type="button" className={s.arvBotao} aria-pressed={m.includes(t)} onClick={() => alternaM(t)}>
                <SetaAzul /><span className={s.arvNome}>Todo o conteúdo de “{no.nome}”</span><span className={s.arvN}>{n}</span>
              </button>
            </li>
            {no.filhos.map((x) => <Fragment key={x.id}>{Linha({ d, no: x, nivel: nivel + 2 })}</Fragment>)}
          </>
        )}
      </>
    );
  }

  function Arvore() {
    return (
      <ul className={s.arvore}>
        {disciplinas.map((d) => {
          const n = porDisc.get(d) ?? 0;
          const filhos = arvoreDaDisciplina(assuntos, d, usados.get(d) ?? []);
          const visiveis = q ? casa(d) || filhos.some((x) => temCasa(d, x)) : true;
          if ((n === 0 && !m.includes(d)) || !visiveis) return null;
          const aberto = !!q || abertos.has(d);
          return (
            <li key={d} className={s.arvDisc}>
              <div className={s.arvLinha} data-marcada={m.includes(d) || undefined}>
                <button type="button" className={s.arvBotao} aria-expanded={aberto} onClick={() => alternaAberto(d)}>
                  <IconePasta aberta={aberto} /><span className={s.arvNome}>{d}</span><span className={s.arvN}>{n}</span>
                </button>
              </div>
              {aberto && (
                <ul className={s.arvFilhos}>
                  <li className={s.arvLinha} style={{ paddingLeft: 30 }} data-marcada={m.includes(d) || undefined}>
                    <button type="button" className={s.arvBotao} aria-pressed={m.includes(d)} onClick={() => alternaM(d)}>
                      <SetaAzul /><span className={s.arvNome}>Todo o conteúdo de “{d}”</span><span className={s.arvN}>{n}</span>
                    </button>
                  </li>
                  {filhos.map((x) => <Fragment key={x.id}>{Linha({ d, no: x, nivel: 2 })}</Fragment>)}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  function ListaOpcoes({ k, rotulo, ordem, nome }: { k: Chave; rotulo?: string; ordem?: 'qtd' | 'desc' | 'abc'; nome?: (v: string) => string }) {
    const c = opcoes(k);
    const itens = Array.from(c.entries()).filter(([v]) => casa(nome ? nome(v) : v));
    itens.sort((a, b) => ordem === 'qtd' ? b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR') : ordem === 'desc' ? b[0].localeCompare(a[0], 'pt-BR', { numeric: true }) : a[0].localeCompare(b[0], 'pt-BR'));
    const marcados = lista(f[k]);
    marcados.filter((v) => !c.has(v) && casa(v)).forEach((v) => itens.unshift([v, 0]));
    return (
      <>
        {rotulo && <div className={s.sepRotulo}><span>{rotulo}</span></div>}
        <ul className={s.arvore}>
          {itens.length === 0 && <li className={s.vazio}>Nada com esses filtros.</li>}
          {itens.map(([v, n]) => (
            <li key={v} className={s.arvLinha} data-marcada={marcados.includes(v) || undefined}>
              <button type="button" className={s.arvBotao} aria-pressed={marcados.includes(v)} onClick={() => alterna(k, v)}>
                <SetaVerde /><span className={s.arvNome}>{nome ? nome(v) : v}</span><span className={s.arvN}>{n}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  function PainelEdital() {
    const itens = editais.map((e) => {
      let n = 0; grupos.forEach((g) => { if (passaG(g, 'e') && mapa.get(e.id)?.has(g.disciplina ?? '')) n += g.n; });
      return { e, n };
    }).filter((x) => casa(x.e.nome) && (x.n > 0 || f.e === x.e.id));
    return (
      <ul className={s.arvore}>
        {itens.length === 0 && <li className={s.vazio}>Nenhum edital com esses filtros.</li>}
        {itens.map(({ e, n }) => (
          <li key={e.id} className={s.arvLinha} data-marcada={f.e === e.id || undefined}>
            <button type="button" className={s.arvBotao} aria-pressed={f.e === e.id} onClick={() => setF((x) => ({ ...x, e: x.e === e.id ? '' : e.id }))}>
              <SetaVerde /><span className={s.arvNome}>{e.nome}</span><span className={s.arvN}>{n}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  // chips dos filtros escolhidos (clicar remove)
  const chips: { rotulo: string; texto: string; tirar: () => void }[] = [];
  if (f.e) chips.push({ rotulo: 'Edital', texto: editais.find((e) => e.id === f.e)?.nome ?? 'Edital', tirar: () => setF((x) => ({ ...x, e: '' })) });
  m.forEach((t) => chips.push({ rotulo: 'Matéria', texto: t.includes('>') ? t.split('>').join(' › ') : `${t} (tudo)`, tirar: () => alternaM(t) }));
  (['b', 'o', 'c', 'y', 'n', 't'] as Chave[]).forEach((k) => lista(f[k]).forEach((v) => chips.push({
    rotulo: { b: 'Banca', o: 'Órgão', c: 'Cargo', y: 'Ano', n: 'Dificuldade', t: 'Tipo' }[k as 'b'],
    texto: k === 'n' ? NIVEIS[v] ?? v : k === 't' ? TIPOS[v] ?? v : v, tirar: () => alterna(k, v),
  })));
  if (novas) chips.push({ rotulo: 'Opção', texto: 'Só as que ainda não fiz', tirar: () => setNovas(false) });

  const filtroUrl = () => {
    const p = new URLSearchParams();
    (['e', 'b', 'o', 'c', 'y', 't', 'n'] as Chave[]).forEach((k) => { if (f[k]) p.set(k, f[k]); });
    if (m.length) p.set('m', m.join('|'));
    if (novas) p.set('s', 'nao_feitas');
    const t = p.toString();
    return t ? `?${t}` : '';
  };
  const filtroJson = () => JSON.stringify({ ...Object.fromEntries((['e', 'b', 'o', 'c', 'y', 't', 'n'] as Chave[]).filter((k) => f[k]).map((k) => [k, f[k]])), ...(m.length ? { m: m.join('|') } : {}), ...(novas ? { s: 'nao_feitas' } : {}) });

  const teto = Math.min(total, maxQtd);
  const opcoesQtd = [10, 20, 30, 50, 100, 200].filter((n) => n < teto);
  const nomeSugerido = (chips.length ? chips.slice(0, 3).map((c) => c.texto.replace(' (tudo)', '')).join(' · ') : 'Caderno').slice(0, 120);
  const ordemPastas = pastasEmOrdem(pastas);

  return (
    <div className={s.filtrar}>
      <div className={s.chipsAbas} role="tablist" aria-label="Tipo de filtro">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className={s.chipAba} onClick={() => { setAba(a.id); setBusca(''); }}>{a.rotulo}</button>
        ))}
      </div>

      <section className={s.painelFiltro} aria-label={ABAS.find((a) => a.id === aba)?.rotulo}>
        {aba !== 'opcoes' && (
          <div className={s.busca}>
            <label htmlFor="busca-filtro" className="sr-only">Pesquisar por nome</label>
            <input id="busca-filtro" type="search" placeholder="Pesquisar por nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        )}
        <div className={s.rolagem}>
          {aba === 'materia' && Arvore()}
          {aba === 'edital' && PainelEdital()}
          {aba === 'banca' && ListaOpcoes({ k: 'b', ordem: 'qtd' })}
          {aba === 'orgao' && (<>{ListaOpcoes({ k: 'o', rotulo: 'Órgão', ordem: 'qtd' })}{ListaOpcoes({ k: 'c', rotulo: 'Cargo', ordem: 'abc' })}</>)}
          {aba === 'ano' && ListaOpcoes({ k: 'y', ordem: 'desc' })}
          {aba === 'opcoes' && (
            <>
              {ListaOpcoes({ k: 'n', rotulo: 'Dificuldade da questão', ordem: 'abc', nome: (v) => NIVEIS[v] ?? v })}
              {ListaOpcoes({ k: 't', rotulo: 'Tipo de questão', ordem: 'abc', nome: (v) => TIPOS[v] ?? v })}
              <div className={s.sepRotulo}><span>Suas atividades na questão</span></div>
              <ul className={s.arvore}>
                <li className={s.arvLinha} data-marcada={novas || undefined}>
                  <button type="button" className={s.arvBotao} aria-pressed={novas} onClick={() => setNovas((x) => !x)}>
                    <SetaVerde /><span className={s.arvNome}>Só as que eu ainda não fiz</span>
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>
      </section>

      <div className={s.barraBaixo} role="region" aria-label="Resumo dos filtros">
        <div className={s.barraTopo}>
          <button type="button" className={s.filtrosBtn} aria-expanded={gaveta} onClick={() => setGaveta((x) => !x)}>
            Filtros <span className={s.filtrosN}>{chips.length}</span> <span aria-hidden="true">{gaveta ? '▾' : '▴'}</span>
          </button>
          {chips.length > 0 && <button type="button" className={s.limpar} onClick={() => { setF(VAZIO); setM([]); setNovas(false); }}>Limpar filtros</button>}
        </div>
        {gaveta && (
          <div className={s.gaveta}>
            {chips.length === 0 && <span className="suave">Nenhum filtro escolhido: todas as questões do banco.</span>}
            {chips.map((c, i) => (
              <button key={`${c.rotulo}${c.texto}${i}`} type="button" className={s.chip} onClick={c.tirar} aria-label={`Tirar filtro ${c.rotulo}: ${c.texto}`}>
                <small>{c.rotulo}</small> {c.texto} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
        <div className={s.barraAcoes}>
          <div className={s.contador} role="status" aria-live="polite"><b className="display">{total}</b><span>{total === 1 ? 'questão' : 'questões'}</span></div>
          <div className={s.botoes}>
            <button type="button" className="btn btn-linha" disabled={total === 0} onClick={() => setModal(true)}>Criar caderno</button>
            {total === 0
              ? <button type="button" className="btn btn-azul" disabled>Resolver</button>
              : <Link href={`/aluno/questoes/resolver${filtroUrl()}`} className="btn btn-azul">Resolver</Link>}
          </div>
        </div>
      </div>

      {modal && (
        <div className={s.fundoModal} role="dialog" aria-modal="true" aria-labelledby="titulo-caderno" onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className={s.modal}>
            <h2 id="titulo-caderno" className="display" style={{ margin: 0, fontSize: 21 }}>Criar caderno</h2>
            <p className="suave" style={{ margin: 0 }}>{total} {total === 1 ? 'questão' : 'questões'} nos filtros escolhidos. O caderno fica guardado numa pasta, em “Meus cadernos”.</p>
            <Formulario acao={criarCaderno} botao="Criar caderno e abrir" classeBotao="btn btn-azul" pendenteTexto="Criando…">
              <input type="hidden" name="filtros" value={filtroJson()} />
              <div className="campo">
                <label htmlFor="cad-nome">Nome do caderno</label>
                <input id="cad-nome" name="titulo" defaultValue={nomeSugerido} maxLength={200} required />
              </div>
              <PastaCampo pastas={ordemPastas} />
              <div className="campo">
                <label htmlFor="cad-qtd">Quantas questões</label>
                <select id="cad-qtd" name="qtd" defaultValue="0">
                  <option value="0">{total > maxQtd ? `As primeiras ${maxQtd}` : `Todas (${total})`}</option>
                  {opcoesQtd.map((n) => <option key={n} value={n}>{n} questões</option>)}
                </select>
              </div>
              {!completo && <span className="suave" style={{ fontSize: 13.5 }}>No plano grátis, os cadernos têm até {maxQtd} questões. <a href="/aluno/planos">Cadernos maiores no banco completo</a>.</span>}
            </Formulario>
            <button type="button" className="btn btn-linha" onClick={() => setModal(false)} style={{ alignSelf: 'flex-start' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// pasta do caderno: escolher uma que já existe ou criar uma nova na hora
function PastaCampo({ pastas }: { pastas: ReturnType<typeof pastasEmOrdem> }) {
  const [v, setV] = useState(pastas.length ? '' : 'nova');
  return (
    <>
      <div className="campo">
        <label htmlFor="cad-pasta">Pasta do caderno</label>
        <select id="cad-pasta" name="pasta" value={v} onChange={(e) => setV(e.target.value)} required>
          <option value="" disabled>Escolha a pasta…</option>
          {pastas.map((p) => <option key={p.id} value={p.id}>{recuo(p.nivel)}{p.nome}</option>)}
          <option value="nova">➕ Nova pasta…</option>
        </select>
      </div>
      {v === 'nova' && (
        <div className="campo">
          <label htmlFor="cad-nova">Nome da nova pasta</label>
          <input id="cad-nova" name="nova_pasta" maxLength={80} placeholder="Ex.: Direito Constitucional" required />
        </div>
      )}
    </>
  );
}
