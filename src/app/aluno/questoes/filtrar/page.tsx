import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { dadosDosFiltros, filtroDaUrl } from '@/lib/banco';
import { marca, type LinhaAssunto } from '@/lib/arvoreAssuntos';
import type { Pasta } from '@/lib/pastas';
import { AbasBanco } from '../AbasBanco';
import { FiltrarQuestoes, type Inicial } from './FiltrarQuestoes';
import s from '../../aluno.module.css';

export const metadata = { title: 'Filtrar questões' };

export default async function Filtrar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ grupos, editais }, { data: ass }, { data: pas }] = await Promise.all([
    dadosDosFiltros(supabase),
    supabase.from('assuntos').select('id, disciplina, nome, pai_id, ordem'),
    supabase.from('pastas_cadernos').select('id, nome, pai_id').eq('aluno_id', perfil.id),
  ]);
  // pode chegar com filtros prontos (de outra tela): disciplina e assunto antigos viram marcas da árvore
  const f = filtroDaUrl(sp);
  const m = new Set((f.m ?? '').split('|').filter(Boolean));
  (f.d ?? '').split('|').filter(Boolean).forEach((d) => (f.a ? (f.a.split('|').filter(Boolean).forEach((a) => m.add(marca(d, a)))) : m.add(d)));
  const inicial: Inicial = { e: f.e, b: f.b, o: f.o, c: f.c, y: f.y, t: f.t, n: f.n, m: Array.from(m).join('|'), novas: f.s === 'nao_feitas' };
  const maxQtd = acesso.completo ? 500 : acesso.listaMax;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Filtrar questões' }]} />
      <AbasBanco ativa="filtrar" />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Filtrar questões</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>Escolha matéria, assunto, banca e o que mais quiser. Depois resolva na hora ou guarde num caderno, dentro de uma pasta.</p>
      </div>
      <FiltrarQuestoes grupos={grupos} editais={editais} assuntos={(ass ?? []) as LinhaAssunto[]} pastas={(pas ?? []) as Pasta[]}
        inicial={inicial} maxQtd={maxQtd} completo={acesso.completo} />
    </>
  );
}
