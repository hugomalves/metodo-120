import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { respostasDasListas } from '@/lib/questao';
import { apagarLista } from '../../actions';
import { MontarLista } from './MontarLista';
import { dadosDosFiltros } from '@/lib/banco';
import { CHAVES } from '@/lib/filtros';
import { CartaoCapa, BarraProgresso } from '@/components/CartaoCapa';
import { iconePorTitulo } from '@/components/Capa';
import s from '../../aluno.module.css';

export const metadata = { title: 'Listas impressas' };

type Lista = { id: string; titulo: string; questoes: string[]; criada_em: string };

export default async function Listas({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const pre = await searchParams;
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ data: listasRaw }, { grupos, editais }] = await Promise.all([
    supabase.from('listas_questoes').select('id, titulo, questoes, criada_em').eq('aluno_id', perfil.id).order('criada_em', { ascending: false }).limit(30),
    dadosDosFiltros(supabase),
  ]);
  // começa no edital que o aluno segue (ou no que veio no link)
  const inicial = Object.fromEntries(CHAVES.map((k) => [k, pre[k] && pre[k]!.length <= 80 ? pre[k]! : '']));
  if (!inicial.e && perfil.edital_id && editais.some((e) => e.id === perfil.edital_id)) inicial.e = perfil.edital_id;
  const listas = (listasRaw ?? []) as Lista[];
  const respostasPorLista = await respostasDasListas(supabase, perfil.id, listas);

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Listas impressas' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Listas impressas</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Escolha o edital, a disciplina, a banca e quantas questões. A lista prioriza as questões que você ainda não fez e fica salva aqui para continuar depois.
        </p>
      </div>

      <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderColor: 'var(--ciano)' }} aria-labelledby="nova">
        <h2 id="nova" className="display" style={{ margin: 0, fontSize: 19 }}>Montar uma lista</h2>
        <MontarLista grupos={grupos} editais={editais} inicial={inicial} maxQtd={acesso.listaMax} />
      </section>

      <section className={s.grupo} aria-labelledby="minhas">
        <h2 id="minhas" className="display">Minhas listas</h2>
        {listas.length === 0 && <p className="suave" style={{ margin: 0 }}>Você ainda não montou nenhuma lista.</p>}
        <div className="cc-grade">
          {listas.map((l) => {
            const respostas = respostasPorLista.get(l.id) ?? new Map<string, boolean>();
            const feitas = l.questoes.filter((q) => respostas.has(q)).length;
            const acertos = l.questoes.filter((q) => respostas.get(q) === true).length;
            const pronta = feitas === l.questoes.length;
            const href = `/aluno/questoes/lista/${l.id}`;
            return (
              <CartaoCapa key={l.id} href={href} tipo="lista" compacto rotulo="Lista impressa" destaque={String(l.questoes.length)}
                icone={iconePorTitulo(l.titulo)} titulo={l.titulo}
                selo={pronta ? `${acertos}/${l.questoes.length} acertos` : feitas ? 'Em andamento' : 'Nova'}
                texto={`${pronta ? 'Concluída' : `${feitas} de ${l.questoes.length} feitas`} · criada em ${new Date(l.criada_em).toLocaleDateString('pt-BR')}`}
                rodape={<>
                  <Link href={href} className="btn btn-azul">{pronta ? 'Ver resultado' : feitas ? 'Continuar' : 'Começar'}</Link>
                  <a href={`/imprimir/lista/${l.id}`} target="_blank" rel="noopener" className="btn btn-azul">Imprimir em PDF</a>
                  <form action={apagarLista}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-linha" aria-label={`Apagar a lista ${l.titulo}`}>Apagar</button>
                  </form>
                </>}>
                <BarraProgresso pct={Math.round((100 * feitas) / l.questoes.length)} rotulo={`${feitas} de ${l.questoes.length} feitas`} />
              </CartaoCapa>
            );
          })}
        </div>
      </section>
    </>
  );
}
