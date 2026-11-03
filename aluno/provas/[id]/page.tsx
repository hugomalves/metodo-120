import { notFound } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarQuestoes } from '@/lib/questao';
import { alternativasDe, origemQuestao } from '@/components/CartaoQuestao';
import { FazerProva, type QuestaoProva } from './FazerProva';
import { ResultadoProva, type Gabarito, type Resultado } from './Resultado';
import s from '../../aluno.module.css';

export const metadata = { title: 'Simulado' };

type Prova = { id: string; titulo: string; questoes: string[]; respostas: string; iniciada_em: string; finalizada_em: string | null; duracao_min: number | null; resultado: Resultado | null };

export default async function ProvaPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await acessoAtual();
  const { data } = await supabase.from('provas').select('id, titulo, questoes, respostas, iniciada_em, finalizada_em, duracao_min, resultado').eq('id', id).eq('aluno_id', perfil.id).maybeSingle();
  const prova = data as Prova | null;
  if (!prova) notFound();
  const questoes = await carregarQuestoes(supabase, perfil.id, prova.questoes);
  const caminho = <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Simulados', href: '/aluno/provas' }, { rotulo: prova.titulo }]} />;

  if (!prova.finalizada_em) {
    const lista: QuestaoProva[] = questoes.map((q) => ({
      id: q.id, disciplina: q.disciplina, origem: origemQuestao(q), enunciado: q.enunciado, figuras: q.figuras,
      textoBase: q.textoBase ? { id: q.textoBase.id, texto: q.textoBase.texto, figuras: q.textoBase.figuras } : null,
      alternativas: alternativasDe(q),
    }));
    return (
      <>
        {caminho}
        <h1 className={`display ${s.titulo}`} style={{ fontSize: 'clamp(22px, 2.8vw, 30px)' }}>{prova.titulo}</h1>
        <FazerProva provaId={prova.id} questoes={lista} inicial={prova.respostas} inicio={prova.iniciada_em} duracaoMin={prova.duracao_min} />
      </>
    );
  }

  const { data: corr } = await supabase.rpc('correcao_prova', { p_prova: prova.id });
  const gabarito = new Map(((corr ?? []) as Gabarito[]).map((c) => [c.questao_id, c]));
  return <ResultadoProva titulo={prova.titulo} respostas={prova.respostas} r={prova.resultado!} questoes={questoes} gabarito={gabarito} caminho={caminho} />;
}
