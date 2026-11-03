import Link from 'next/link';
import { cookies } from 'next/headers';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { buscarQuestoes, dadosDosFiltros, filtroDaUrl, urlFiltro } from '@/lib/banco';
import { CHAVES } from '@/lib/filtros';
import { carregarQuestoes, porPagina as lerPorPagina } from '@/lib/questao';
import { Caderno } from '@/components/Caderno';
import { FiltrosBanco } from './FiltrosBanco';
import s from '../aluno.module.css';

export const metadata = { title: 'Banco de questões' };

export default async function BancoQuestoes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filtro = filtroDaUrl(sp);
  const pp = lerPorPagina(sp.pp, (await cookies()).get('gq_pp')?.value);
  const { supabase, perfil, acesso } = await acessoAtual();

  // sem filtro na URL, o banco abre no edital que o aluno está seguindo
  if (!Object.keys(filtro).length && perfil.edital_id && !sp.todos) filtro.e = perfil.edital_id;
  const [{ lista, minhas }, { grupos, editais }] = await Promise.all([buscarQuestoes(supabase, perfil.id, filtro), dadosDosFiltros(supabase)]);
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / pp));
  const pagina = Math.min(paginas, Math.max(1, parseInt(sp.p ?? '1', 10) || 1));
  const ids = lista.slice((pagina - 1) * pp, pagina * pp).map((q) => q.id);
  const questoes = await carregarQuestoes(supabase, perfil.id, ids);
  const feitas = Array.from(minhas.values());
  const acertos = feitas.filter((r) => r.acertou).length;
  const filtrosAtivos = [...CHAVES, 's' as const].filter((k) => filtro[k]).length;
  const edital = editais.find((e) => e.id === filtro.e);
  const base = `/aluno/questoes${urlFiltro(filtro)}`;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Questões' }]} />
      <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className={s.cabeca}>
          <h1 className={`display ${s.titulo}`}>{filtro.d ? `Questões de ${filtro.d}` : edital ? `Questões · ${edital.nome}` : 'Banco de questões'}</h1>
          <span className="suave">
            {feitas.length} resolvidas · {feitas.length ? `${Math.round((100 * acertos) / feitas.length)}% de acertos` : 'nenhuma ainda'}
          </span>
        </div>
        <Link href="/aluno/questoes/listas" className="btn btn-linha">Montar uma lista sob medida</Link>
      </div>

      {!acesso.completo && (
        <div className="q-plano" role="status">
          <span><b>Plano grátis:</b> {acesso.usadasHoje} de {acesso.limiteDia} questões respondidas hoje.</span>
          <Link href="/aluno/planos">Responder sem limite</Link>
        </div>
      )}

      <details className="q-filtros" open={filtrosAtivos > 0 || undefined}>
        <summary>
          <span>Filtrar questões</span>
          {filtrosAtivos > 0 && <span className="q-filtros-n">{filtrosAtivos} {filtrosAtivos === 1 ? 'filtro ativo' : 'filtros ativos'}</span>}
        </summary>
        <FiltrosBanco grupos={grupos} editais={editais} inicial={Object.fromEntries(CHAVES.map((k) => [k, filtro[k] ?? '']))} situacao={filtro.s} pp={sp.pp ? String(pp) : undefined} />
      </details>

      {total === 0 ? (
        <p className="suave" style={{ margin: 0 }}>Nenhuma questão com esses filtros ainda.</p>
      ) : (
        <Caderno questoes={questoes} total={total} pagina={pagina} porPagina={pp} base={base} />
      )}
    </>
  );
}
