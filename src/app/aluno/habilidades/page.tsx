import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { COMPETENCIAS, HABILIDADES, nivelDe } from '@/lib/habilidades';
import { CartaoCapa } from '@/components/CartaoCapa';
import { iconePorTitulo } from '@/components/Capa';
import s from '../aluno.module.css';

export const metadata = { title: 'Habilidades do ENEM' };

type Hab = { habilidade: string; acertos: number; total: number; pct: number };

export default async function Habilidades() {
  const { supabase } = await exigirCurso();
  const [{ data: habsRaw }, { data: matsRaw }, { data: questoesRaw }] = await Promise.all([
    supabase.rpc('minhas_habilidades'),
    supabase.from('materiais_habilidade').select('habilidade, tipo'),
    supabase.from('questoes').select('habilidade').eq('area', 'matematica').limit(5000),
  ]);
  const minhas = new Map(((habsRaw ?? []) as Hab[]).map((h) => [h.habilidade, h]));
  const conta = (cod: string, tipo: string) => ((matsRaw ?? []) as { habilidade: string; tipo: string }[]).filter((m) => m.habilidade === cod && m.tipo === tipo).length;
  const nQuestoes = (cod: string) => ((questoesRaw ?? []) as { habilidade: string | null }[]).filter((q) => q.habilidade === cod).length;
  const piores = ((habsRaw ?? []) as Hab[]).slice(-3).reverse();

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Habilidades' }]} />
      <div className={s.cabeca}>
        <span className="rotulo">Matriz de Referência do ENEM</span>
        <h1 className={`display ${s.titulo}`}>As 30 habilidades de Matemática</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '68ch' }}>
          Cada habilidade tem aulas próprias, listas de exercícios e questões do banco. Seu nível aparece depois dos simulados.
        </p>
      </div>

      {piores.length > 0 && (
        <section className="cartao-gradiente" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="sug">
          <h2 id="sug" className="display" style={{ margin: 0, fontSize: 19 }}>Por onde começar</h2>
          <div className="linha-flex">
            {piores.map((h) => (
              <Link key={h.habilidade} href={`/aluno/habilidade/${h.habilidade}`} className="btn btn-ciano">
                {h.habilidade} · {h.pct}% de acertos
              </Link>
            ))}
          </div>
        </section>
      )}

      {COMPETENCIAS.map((c) => (
        <section key={c.numero} className={s.grupo} aria-labelledby={`c${c.numero}`}>
          <h2 id={`c${c.numero}`} className="display" style={{ fontSize: 19 }}>
            <span className="mono suave" style={{ fontSize: 14, marginRight: 8 }}>C{c.numero}</span>{c.nome}
          </h2>
          <div className="cc-grade">
            {c.habilidades.map((cod) => {
              const m = minhas.get(cod);
              const n = m ? nivelDe(m.pct) : null;
              const aulas = conta(cod, 'aula');
              const listas = conta(cod, 'lista');
              const q = nQuestoes(cod);
              return (
                <CartaoCapa key={cod} href={`/aluno/habilidade/${cod}`} tipo="habilidade" competencia={c.numero} compacto
                  rotulo={`Competência ${c.numero}`} destaque={cod} icone={iconePorTitulo(`${c.nome} ${HABILIDADES[cod]}`)}
                  titulo={`Habilidade ${cod}`} texto={HABILIDADES[cod]}
                  selo={n && m ? `${n.rotulo} · ${m.pct}%` : undefined}
                  rodape={<span className="cc-info">
                    {[aulas && `${aulas} ${aulas === 1 ? 'aula' : 'aulas'}`, listas && `${listas} ${listas === 1 ? 'lista' : 'listas'}`, q && `${q} questões`].filter(Boolean).join(' · ') || 'Materiais em breve'}
                  </span>} />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
