import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { ASSUNTOS } from '@/lib/assuntos';
import { GradeClassificacao } from './GradeClassificacao';
import styles from '../../professor.module.css';

export const metadata = { title: 'Classificar questões · Painel do professor' };

type Sim = { id: string; codigo: string; n_questoes: number; gabaritos: Gab | Gab[] | null };
type Gab = { respostas: string; habilidades: string[]; assuntos: string[]; niveis: string[]; comentarios: string[] };

export default async function ClassificarSimulado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: usados }] = await Promise.all([
    supabase.from('simulados').select('id, codigo, n_questoes, gabaritos(respostas, habilidades, assuntos, niveis, comentarios)').eq('id', id).maybeSingle(),
    supabase.rpc('assuntos_usados'),
  ]);
  const sim = data as unknown as Sim | null;
  if (!sim) notFound();
  const g = Array.isArray(sim.gabaritos) ? (sim.gabaritos[0] ?? null) : sim.gabaritos;
  const sugestoes = Array.from(new Set([...((usados ?? []) as string[]), ...ASSUNTOS])).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Simulados e gabaritos', href: '/professor/simulados' }, { rotulo: `Classificar ${sim.codigo}` }]} />
      <h1 className={`display ${styles.titulo}`}>Classificar {sim.codigo}</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        Assunto, habilidade e nível de cada questão alimentam o ranking “Questões que mais derrubam” e o “O que estudar agora” do aluno.
        O comentário aparece para o aluno na lista de questões para revisar, depois que ele envia o cartão.
      </p>
      <section className={`cartao ${styles.bloco}`}>
        {g ? (
          <GradeClassificacao simuladoId={sim.id} gabarito={g.respostas} habilidades={g.habilidades ?? []} assuntos={g.assuntos ?? []}
            niveis={g.niveis ?? []} comentarios={g.comentarios ?? []} sugestoes={sugestoes} />
        ) : (
          <p className="suave" style={{ margin: 0 }}>Este simulado ainda não tem gabarito.</p>
        )}
      </section>
    </>
  );
}
