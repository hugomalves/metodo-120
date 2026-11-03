import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirLogin } from '@/lib/sessao';
import { Caminho, PAINEL_ALUNO, type Passo } from '@/components/Caminho';
import { buscarQuestoes, filtroDaUrl, urlFiltro } from '@/lib/banco';
import { carregarQuestoes } from '@/lib/questao';
import { CartaoQuestao } from '@/components/CartaoQuestao';

// Uma questão sozinha (link direto, dúvidas, listas)
export default async function QuestaoPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const filtro = filtroDaUrl(sp);
  const listaId = sp.lista && /^[0-9a-f-]{36}$/i.test(sp.lista) ? sp.lista : null;
  const { supabase, perfil } = await exigirLogin();

  const { data: listaRaw } = listaId
    ? await supabase.from('listas_questoes').select('id, titulo, questoes').eq('id', listaId).eq('aluno_id', perfil.id).maybeSingle()
    : { data: null };
  const lista = listaRaw as { id: string; titulo: string; questoes: string[] } | null;

  const [q] = await carregarQuestoes(supabase, perfil.id, [id], lista?.id);
  if (!q) notFound();

  let proxima: string | null = null;
  let numero: number | undefined;
  let total: number | undefined;
  if (lista) {
    const i = lista.questoes.indexOf(id);
    numero = i + 1; total = lista.questoes.length;
    proxima = lista.questoes[i + 1] ?? null;
  } else {
    const { lista: todas, minhas } = await buscarQuestoes(supabase, perfil.id, filtro);
    const i = todas.findIndex((x) => x.id === id);
    proxima = [...todas.slice(i + 1), ...todas.slice(0, Math.max(i, 0))].find((x) => !minhas.has(x.id) && x.id !== id)?.id ?? null;
  }
  const sufixo = lista ? `?lista=${lista.id}` : urlFiltro(filtro);
  const caminho: Passo[] = lista
    ? [PAINEL_ALUNO, { rotulo: 'Listas', href: '/aluno/questoes/listas' }, { rotulo: lista.titulo, href: `/aluno/questoes/lista/${lista.id}` }, { rotulo: `Questão ${numero}` }]
    : [PAINEL_ALUNO, { rotulo: 'Questões', href: `/aluno/questoes${urlFiltro(filtro)}` }, { rotulo: q.codigo }];

  return (
    <>
      <Caminho passos={caminho} />
      <CartaoQuestao q={q} numero={numero} total={total} lista={lista?.id} />
      <div className="linha-flex" style={{ justifyContent: 'flex-end' }}>
        {proxima ? (
          <Link href={`/aluno/questoes/${proxima}${sufixo}`} className="btn btn-azul">Próxima questão →</Link>
        ) : lista ? (
          <Link href={`/aluno/questoes/lista/${lista.id}`} className="btn btn-azul">Ver o resultado da lista</Link>
        ) : (
          <Link href={`/aluno/questoes${urlFiltro(filtro)}`} className="btn btn-linha">Voltar às questões</Link>
        )}
      </div>
    </>
  );
}
