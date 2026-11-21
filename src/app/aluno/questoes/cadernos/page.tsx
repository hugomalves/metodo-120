import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { respostasDasListas } from '@/lib/questao';
import { caminhoDaPasta, pastasEmOrdem, recuo, type Pasta } from '@/lib/pastas';
import { AbasBanco } from '../AbasBanco';
import { IconeCaderno, IconePasta } from '../Icones';
import { apagarCaderno, excluirPasta, moverCaderno, renomearCaderno, renomearPasta } from '../acoes';
import { NovaPasta } from './NovaPasta';
import b from '../banco.module.css';
import s from '../../aluno.module.css';

export const metadata = { title: 'Meus cadernos' };
export const dynamic = 'force-dynamic';

type Caderno = { id: string; titulo: string; questoes: string[]; pasta_id: string | null; criada_em: string };
const UUID = /^[0-9a-f-]{36}$/i;
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export default async function MeusCadernos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, perfil } = await acessoAtual();
  const busca = (sp.q ?? '').trim().slice(0, 80);
  const [{ data: pas }, { data: todos }] = await Promise.all([
    supabase.from('pastas_cadernos').select('id, nome, pai_id').eq('aluno_id', perfil.id),
    supabase.from('listas_questoes').select('pasta_id').eq('aluno_id', perfil.id).limit(5000),
  ]);
  const pastas = (pas ?? []) as Pasta[];
  const atual = sp.pasta && UUID.test(sp.pasta) && pastas.some((p) => p.id === sp.pasta) ? sp.pasta : null;
  const nCadernos = new Map<string | null, number>();
  ((todos ?? []) as { pasta_id: string | null }[]).forEach((x) => nCadernos.set(x.pasta_id, (nCadernos.get(x.pasta_id) ?? 0) + 1));

  let consulta = supabase.from('listas_questoes').select('id, titulo, questoes, pasta_id, criada_em').eq('aluno_id', perfil.id).order('criada_em', { ascending: false }).limit(200);
  if (busca) consulta = consulta.ilike('titulo', `%${busca.replace(/[%_]/g, '')}%`);
  else consulta = atual ? consulta.eq('pasta_id', atual) : consulta.is('pasta_id', null);
  const { data: cad } = await consulta;
  const cadernos = (cad ?? []) as Caderno[];
  const respostas = await respostasDasListas(supabase, perfil.id, cadernos);

  const subpastas = busca ? [] : pastas.filter((p) => p.pai_id === atual).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const trilha = caminhoDaPasta(pastas, atual);
  const nomeDaPasta = (id: string | null) => pastas.find((p) => p.id === id)?.nome;
  const ordem = pastasEmOrdem(pastas);
  const pai = trilha.length > 1 ? trilha[trilha.length - 2].id : null;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Meus cadernos' }]} />
      <AbasBanco ativa="cadernos" />
      <div className={s.cabeca}><h1 className={`display ${s.titulo}`}>Meus cadernos</h1></div>

      <div className={b.topoCadernos}>
        <div className={b.caminhoPastas} aria-label="Pasta atual">
          <Link href="/aluno/questoes/cadernos">Todas as pastas</Link>
          {trilha.map((p, i) => (
            <span key={p.id}>› {i === trilha.length - 1 ? <b>{p.nome}</b> : <Link href={`/aluno/questoes/cadernos?pasta=${p.id}`}>{p.nome}</Link>}</span>
          ))}
        </div>
        <Link href="/aluno/questoes/filtrar" className="btn btn-azul">Novo caderno</Link>
      </div>

      <div className="linha-flex" style={{ alignItems: 'flex-start', gap: 12 }}>
        <NovaPasta pai={atual} />
        <form method="get" className="linha-flex" style={{ flex: '2 1 320px', gap: 8 }}>
          {atual && <input type="hidden" name="pasta" value={atual} />}
          <input name="q" defaultValue={busca} placeholder="Nome do caderno" aria-label="Buscar caderno pelo nome"
            style={{ flex: 1, minHeight: 44, padding: '0 12px', background: 'var(--faixa)', color: 'var(--texto)', border: '1.5px solid var(--linha-forte)', borderRadius: 3, font: 'inherit', minWidth: 0 }} />
          <button className="btn btn-linha">Buscar</button>
          {busca && <Link href="/aluno/questoes/cadernos" className="btn btn-linha">Limpar</Link>}
        </form>
      </div>

      {subpastas.length > 0 && (
        <section className={`cartao ${b.listaPastas}`} aria-label="Pastas">
          {subpastas.map((p) => {
            const filhas = pastas.filter((x) => x.pai_id === p.id).length;
            return (
              <div key={p.id} className={b.linhaPasta}>
                <IconePasta />
                <div className={b.nome}>
                  <Link href={`/aluno/questoes/cadernos?pasta=${p.id}`}>{p.nome}</Link>
                  <div className={b.acoesMini}>
                    <details>
                      <summary>Renomear</summary>
                      <form action={renomearPasta} className={b.formInline}>
                        <input type="hidden" name="id" value={p.id} />
                        <input name="nome" defaultValue={p.nome} maxLength={80} required aria-label="Novo nome da pasta" />
                        <button className="btn btn-linha">Salvar</button>
                      </form>
                    </details>
                    <details>
                      <summary style={{ color: 'var(--erro)' }}>Excluir</summary>
                      <form action={excluirPasta} className={b.formInline}>
                        <input type="hidden" name="id" value={p.id} />
                        {atual && <input type="hidden" name="pai" value={atual} />}
                        <span className="suave" style={{ fontSize: 13 }}>Apaga também as pastas de dentro. Os cadernos não são apagados: ficam sem pasta.</span>
                        <button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Confirmar exclusão</button>
                      </form>
                    </details>
                  </div>
                </div>
                <span className={b.quantos}>{plural(nCadernos.get(p.id) ?? 0, 'caderno', 'cadernos')}{filhas ? ` · ${plural(filhas, 'subpasta', 'subpastas')}` : ''}</span>
              </div>
            );
          })}
        </section>
      )}

      {atual && !busca && <Link href={pai ? `/aluno/questoes/cadernos?pasta=${pai}` : '/aluno/questoes/cadernos'} style={{ alignSelf: 'flex-start' }}>‹ Voltar</Link>}

      <section className="cartao" aria-label="Cadernos">
        {cadernos.length === 0 && (
          <p className="suave" style={{ margin: 0, padding: 18 }}>
            {busca ? 'Nenhum caderno com esse nome.' : atual ? 'Esta pasta ainda não tem cadernos.' : subpastas.length ? 'Nenhum caderno solto fora das pastas.' : 'Você ainda não tem cadernos. Filtre as questões e crie o primeiro.'}
          </p>
        )}
        {cadernos.map((c) => {
          const r = respostas.get(c.id) ?? new Map<string, boolean>();
          const feitas = c.questoes.filter((q) => r.has(q)).length;
          const acertos = c.questoes.filter((q) => r.get(q) === true).length;
          const pct = Math.round((100 * feitas) / Math.max(1, c.questoes.length));
          return (
            <div key={c.id} className={b.cartaoCaderno}>
              <IconeCaderno />
              <div className={b.info}>
                <Link href={`/aluno/questoes/lista/${c.id}`}>{c.titulo}</Link>
                <span className={b.progresso}>
                  {feitas} de {c.questoes.length} feitas{feitas ? ` · ${acertos} acertos` : ''} · criado em {new Date(c.criada_em).toLocaleDateString('pt-BR')}
                  {busca && c.pasta_id ? <> · pasta: <Link href={`/aluno/questoes/cadernos?pasta=${c.pasta_id}`}>{nomeDaPasta(c.pasta_id)}</Link></> : null}
                </span>
                <span className={b.barra}><span style={{ width: `${pct}%` }} /></span>
                <div className={b.acoesMini}>
                  <details>
                    <summary>Renomear</summary>
                    <form action={renomearCaderno} className={b.formInline}>
                      <input type="hidden" name="id" value={c.id} />
                      <input name="titulo" defaultValue={c.titulo} maxLength={200} required aria-label="Novo nome do caderno" />
                      <button className="btn btn-linha">Salvar</button>
                    </form>
                  </details>
                  <details>
                    <summary>Mover para outra pasta</summary>
                    <form action={moverCaderno} className={b.formInline}>
                      <input type="hidden" name="id" value={c.id} />
                      <select name="pasta" defaultValue={c.pasta_id ?? ''} aria-label="Pasta de destino">
                        <option value="">Sem pasta</option>
                        {ordem.map((p) => <option key={p.id} value={p.id}>{recuo(p.nivel)}{p.nome}</option>)}
                      </select>
                      <button className="btn btn-linha">Mover</button>
                    </form>
                  </details>
                  <details>
                    <summary style={{ color: 'var(--erro)' }}>Apagar</summary>
                    <form action={apagarCaderno} className={b.formInline}>
                      <input type="hidden" name="id" value={c.id} />
                      <span className="suave" style={{ fontSize: 13 }}>O caderno e as respostas dadas nele serão apagados.</span>
                      <button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Confirmar</button>
                    </form>
                  </details>
                </div>
              </div>
              <div className="linha-flex" style={{ gap: 8 }}>
                <Link href={`/aluno/questoes/lista/${c.id}`} className="btn btn-azul">{pct === 100 ? 'Ver resultado' : feitas ? 'Continuar' : 'Começar'}</Link>
                <a href={`/imprimir/lista/${c.id}`} target="_blank" rel="noopener" className="btn btn-linha">Imprimir em PDF</a>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
