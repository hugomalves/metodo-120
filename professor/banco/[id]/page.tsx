import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { linkArquivo } from '@/lib/arquivos';
import { FormQuestao, type QuestaoForm } from '../FormQuestao';
import { excluirQuestao } from '../../actions';
import styles from '../../professor.module.css';

export const metadata = { title: 'Editar questão · Painel do professor' };

type G = { resposta: string; comentario: string | null; video_url: string | null };

export default async function EditarQuestao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: discs }, { data: assuntos }] = await Promise.all([
    supabase.from('questoes').select('*, questoes_gabarito(resposta, comentario, video_url), textos_base(codigo)').eq('id', id).maybeSingle(),
    supabase.from('disciplinas').select('nome').order('ordem').order('nome'),
    supabase.from('assuntos').select('disciplina, nome').order('nome'),
  ]);
  if (!data) notFound();
  const bruto = data as Record<string, unknown> & {
    imagem_path: string | null; codigo: string; prova: string | null; numero_prova: number | null; revisada: boolean;
    questoes_gabarito: G | G[] | null; textos_base: { codigo: string } | null;
  };
  // próxima questão ainda não revisada da mesma prova (para revisar em sequência)
  let prox = supabase.from('questoes').select('id').eq('revisada', false).neq('id', id).order('numero_prova', { nullsFirst: false }).order('codigo').limit(1);
  prox = bruto.prova ? prox.eq('prova', bruto.prova) : prox.is('prova', null);
  if (bruto.numero_prova) prox = prox.gt('numero_prova', bruto.numero_prova);
  const { data: proxRaw } = await prox.maybeSingle();
  const g = Array.isArray(bruto.questoes_gabarito) ? bruto.questoes_gabarito[0] : bruto.questoes_gabarito;
  const q: QuestaoForm = {
    ...(bruto as unknown as QuestaoForm), imagem: await linkArquivo(supabase, bruto.imagem_path),
    texto_base: bruto.textos_base?.codigo ?? null, resposta: g?.resposta, comentario: g?.comentario, video_url: g?.video_url,
  };

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Banco de questões', href: '/professor/banco' }, { rotulo: bruto.codigo }]} />
      <h1 className={`display ${styles.titulo}`}>{bruto.revisada ? 'Editar' : 'Revisar'} {bruto.codigo}</h1>
      <section className={`cartao ${styles.bloco}`}>
        <FormQuestao q={q} disciplinas={((discs ?? []) as { nome: string }[]).map((x) => x.nome)}
          assuntos={(assuntos ?? []) as { disciplina: string; nome: string }[]} proximaId={(proxRaw as { id: string } | null)?.id ?? null} />
      </section>
      <details className={`cartao ${styles.bloco}`}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--erro)' }}>Excluir esta questão</summary>
        <form action={excluirQuestao} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10 }}>
          <input type="hidden" name="id" value={id} />
          <label className={styles.check} style={{ fontWeight: 500 }}><input type="checkbox" required /> Apagar a questão {bruto.codigo} e as respostas dos alunos a ela</label>
          <button className="btn btn-perigo" style={{ alignSelf: 'flex-start' }}>Excluir</button>
        </form>
      </details>
    </>
  );
}
