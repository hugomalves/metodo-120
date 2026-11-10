import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarLoja, linkCompra, produtoQueLibera } from '@/lib/loja';
import { Cadeado } from '@/components/CartaoProduto';
import s from '../aluno.module.css';

export const metadata = { title: 'Minissimulados' };

type Aula = { aula_id: string; modulo_titulo: string; disciplina: string | null; numero: number; titulo: string; tem_mini: boolean };

// Um minissimulado por aula, só para quem tem o curso em PDF; os demais veem os títulos com cadeado
export default async function Minissimulados() {
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ data: cat }, { data: sims }, loja] = await Promise.all([
    supabase.rpc('catalogo_aulas'),
    supabase.from('simulados').select('id, aula_id, n_questoes').not('aula_id', 'is', null).eq('liberado', true),
    carregarLoja(supabase, perfil.id),
  ]);
  const porAula = new Map(((sims ?? []) as { id: string; aula_id: string; n_questoes: number }[]).map((x) => [x.aula_id, x]));
  const aulas = ((cat ?? []) as Aula[]).filter((a) => a.tem_mini);
  const curso = produtoQueLibera(loja.produtos, 'curso', perfil.edital_id);
  const grupos = new Map<string, Aula[]>();
  aulas.forEach((a) => { const k = a.disciplina ?? 'Outras'; grupos.set(k, [...(grupos.get(k) ?? []), a]); });

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Minissimulados' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Minissimulados</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Cada aula do curso em PDF tem o seu minissimulado: questões da aula e de aulas anteriores, cartão-resposta para preencher e o gabarito comentado depois do envio.
          {!acesso.curso && ' Eles fazem parte dos cursos em PDF.'}
        </p>
      </div>
      {aulas.length === 0 && <p className="suave">Os minissimulados serão publicados junto com as aulas.</p>}
      {Array.from(grupos.entries()).map(([disc, lista]) => (
        <section key={disc} className={s.grupo} aria-label={disc}>
          <h2 className="display">{disc}</h2>
          <div className="quadros">
            {lista.map((a) => {
              const sim = porAula.get(a.aula_id);
              const href = acesso.curso && sim ? `/aluno/simulado/${sim.id}` : linkCompra(curso);
              const externo = !acesso.curso && href.startsWith('http');
              return (
                <a key={a.aula_id} href={href} className="quadro" data-bloqueado={acesso.curso ? undefined : 'sim'} {...(externo ? { target: '_blank', rel: 'noopener' } : {})}>
                  <span className="quadro-selo">{acesso.curso ? `${sim?.n_questoes ?? ''} questões` : 'Curso em PDF'}</span>
                  <b>{a.titulo}</b>
                  <span>{a.modulo_titulo} · aula {a.numero}</span>
                  {!acesso.curso && <span className="quadro-cadeado"><Cadeado /></span>}
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
