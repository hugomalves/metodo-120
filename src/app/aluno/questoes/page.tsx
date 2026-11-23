import Link from 'next/link';
import { redirect } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CHAVES } from '@/lib/filtros';
import { minhasTentativas, respostasDasListas } from '@/lib/questao';
import { AbasBanco } from './AbasBanco';
import { AvisosCarrossel, type Aviso } from './AvisosCarrossel';
import { IconeCaderno, IconePasta } from './Icones';
import b from './banco.module.css';
import s from '../aluno.module.css';

export const metadata = { title: 'Banco de questões' };

type Caderno = { id: string; titulo: string; questoes: string[]; pasta_id: string | null; criada_em: string };

// links antigos (com filtros) continuam funcionando: vão direto para as questões
const CHAVES_ANTIGAS: string[] = [...CHAVES, 's', 'm', 'todos', 'h', 'p', 'pp'];
const mil = (n: number) => n.toLocaleString('pt-BR');

function Ic({ d }: { d: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

export default async function BancoHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (CHAVES_ANTIGAS.some((k) => sp[k])) {
    const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    redirect(`/aluno/questoes/resolver?${q.toString()}`);
  }
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ data: av }, { data: cad }, { count: nCadernos }, { count: nQuestoes }, { data: pas }, tentativas] = await Promise.all([
    supabase.from('avisos_banco').select('id, titulo, texto, link_url, link_texto').eq('ativo', true).order('ordem').order('criado_em', { ascending: false }).limit(10),
    supabase.from('listas_questoes').select('id, titulo, questoes, pasta_id, criada_em').eq('aluno_id', perfil.id).order('criada_em', { ascending: false }).limit(6),
    supabase.from('listas_questoes').select('id', { count: 'exact', head: true }).eq('aluno_id', perfil.id),
    supabase.from('questoes').select('id', { count: 'exact', head: true }).eq('publicada', true),
    supabase.from('pastas_cadernos').select('id, nome').eq('aluno_id', perfil.id),
    minhasTentativas(supabase, perfil.id),
  ]);
  const cadernos = (cad ?? []) as Caderno[];
  const pastas = new Map(((pas ?? []) as { id: string; nome: string }[]).map((x) => [x.id, x.nome]));
  const respostas = await respostasDasListas(supabase, perfil.id, cadernos);
  const ultima = new Map<string, boolean>();
  tentativas.forEach((t) => { if (!ultima.has(t.questao_id)) ultima.set(t.questao_id, t.acertou); });
  const resolvidas = ultima.size;
  const acertadas = Array.from(ultima.values()).filter(Boolean).length;
  const erradas = resolvidas - acertadas;
  const pct = resolvidas ? Math.round((100 * acertadas) / resolvidas) : 0;
  const avisos: Aviso[] = (av ?? []) as Aviso[];
  if (!avisos.length) avisos.push({ id: 'padrao', titulo: 'Bem-vindo ao banco de questões', texto: 'Filtre por matéria, assunto e banca, guarde as questões em cadernos e refaça os seus erros.', link_url: '/aluno/questoes/filtrar', link_texto: 'Filtrar questões' });

  const atalhos = [
    { href: '/aluno/questoes/filtrar', titulo: 'Filtrar questões', texto: 'Matéria, assunto, banca, ano', num: `${mil(nQuestoes ?? 0)} questões`, icone: 'M4 5h16l-6 7v6l-4 2v-8z', cor: '#2F6BFF' },
    { href: '/aluno/questoes/cadernos', titulo: 'Meus cadernos', texto: 'Suas questões em pastas', num: `${mil(nCadernos ?? 0)} ${nCadernos === 1 ? 'caderno' : 'cadernos'}`, icone: 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM8 4v16', cor: '#f5a524' },
    { href: '/aluno/questoes/erros', titulo: 'Cadernos de erros', texto: 'Refaça o que você errou', num: `${mil(erradas)} para rever`, icone: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6', cor: '#ef4444' },
    { href: '/aluno/questoes/listas', titulo: 'Imprimir lista em PDF', texto: 'Monte e imprima', num: 'PDF com gabarito', icone: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z', cor: '#22b35a' },
  ];

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões' }]} />
      <AbasBanco ativa="home" />
      <div className={b.homeTopo}>
        <h1 className={`display ${s.titulo}`} style={{ margin: 0 }}>Meus Estudos</h1>
        <Link href="/aluno/questoes/filtrar" className="btn btn-azul">Resolver questões</Link>
      </div>

      {!acesso.completo && (
        <div className="q-plano" role="status">
          <span><b>Plano grátis:</b> {acesso.usadasHoje} de {acesso.limiteDia} questões respondidas hoje.</span>
          <Link href="/aluno/planos">Responder sem limite</Link>
        </div>
      )}

      <section aria-label="Avisos"><AvisosCarrossel avisos={avisos} /></section>

      <nav className={b.atalhos} aria-label="Atalhos do banco">
        {atalhos.map((a) => (
          <Link key={a.href} href={a.href} className={b.atalho} style={{ ['--cor' as string]: a.cor }}>
            <span className={b.atalhoIcone}><Ic d={a.icone} /></span>
            <b>{a.titulo}</b>
            <span>{a.texto}</span>
            <small>{a.num}</small>
          </Link>
        ))}
      </nav>

      <div className={b.homeGrade}>
        <section className={`cartao ${b.bloco}`} aria-labelledby="cadernos">
          <div className={b.blocoTopo}>
            <h2 id="cadernos" className="display">Cadernos de estudo</h2>
            <Link href="/aluno/questoes/cadernos">Ver todos ›</Link>
          </div>
          {cadernos.length === 0 && (
            <div className={b.vazioGrande}>
              <IconeCaderno />
              <p>Você ainda não criou nenhum caderno. Filtre as questões e guarde numa pasta.</p>
            </div>
          )}
          <div className={b.listaCad}>
            {cadernos.map((c) => {
              const r = respostas.get(c.id) ?? new Map<string, boolean>();
              const feitas = c.questoes.filter((q) => r.has(q)).length;
              const p = Math.round((100 * feitas) / Math.max(1, c.questoes.length));
              return (
                <div key={c.id} className={b.cadLinha}>
                  <span className={b.cadIcone}><IconeCaderno /></span>
                  <div className={b.cadInfo}>
                    <Link href={`/aluno/questoes/lista/${c.id}`}>{c.titulo}</Link>
                    <span>
                      {c.pasta_id && pastas.get(c.pasta_id) ? <><IconePasta /> {pastas.get(c.pasta_id)} · </> : null}
                      {feitas} de {c.questoes.length} feitas
                    </span>
                    <span className={b.barra}><span style={{ width: `${p}%` }} /></span>
                  </div>
                  <Link href={`/aluno/questoes/lista/${c.id}`} className={b.cadBotao}>{p === 100 ? 'Ver' : feitas ? 'Continuar' : 'Começar'}</Link>
                </div>
              );
            })}
          </div>
          <Link href="/aluno/questoes/filtrar" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>+ Criar novo caderno</Link>
        </section>

        <section className={`cartao ${b.bloco}`} aria-labelledby="desempenho">
          <div className={b.blocoTopo}>
            <h2 id="desempenho" className="display">Desempenho</h2>
            <Link href="/aluno/estatisticas">Estatísticas ›</Link>
          </div>
          <div className={b.anelLinha}>
            <div className={b.anel} style={{ ['--p' as string]: `${pct}` }} role="img" aria-label={`${pct}% de acertos`}>
              <b className="display">{resolvidas ? `${pct}%` : '—'}</b><span>de acertos</span>
            </div>
            <ul className={b.numerosLista}>
              <li><b>{mil(resolvidas)}</b><span>resolvidas</span></li>
              <li className={b.ok}><b>{mil(acertadas)}</b><span>acertos</span></li>
              <li className={b.ruim}><b>{mil(erradas)}</b><span>para rever</span></li>
            </ul>
          </div>
          {erradas > 0
            ? <Link href="/aluno/questoes/erros" className="btn btn-linha" style={{ alignSelf: 'stretch', textAlign: 'center' }}>{erradas === 1 ? "Refazer meu erro" : `Refazer meus ${erradas} erros`}</Link>
            : <span className="suave" style={{ fontSize: 14 }}>Resolva algumas questões para ver seu desempenho aqui.</span>}
        </section>
      </div>
    </>
  );
}
