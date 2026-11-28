import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { AbasRedacao } from '../AbasRedacao';
import { FormRedacao } from './FormRedacao';
import s from '../redacao.module.css';

export const metadata = { title: 'Nova redação' };
export const dynamic = 'force-dynamic';
// o envio dispara a pré-correção por IA em segundo plano (para o professor); ela leva até ~1 min
export const maxDuration = 60;

export default async function NovaRedacao({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const slug = String((await searchParams).tema ?? '').slice(0, 60);
  const { supabase, perfil } = await exigirCurso();
  const [lim, noMes] = await Promise.all([supabase.rpc('redacoes_limite'), supabase.rpc('redacoes_no_mes')]);
  const ativada = !lim.error && !noMes.error;
  const limite = typeof lim.data === 'number' ? lim.data : 8;
  const usadas = typeof noMes.data === 'number' ? noMes.data : 0;

  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Nova redação' }]} />
      <AbasRedacao ativa="nova" />
      <div className={s.cabeca}>
        <h1 className="display">Nova redação</h1>
        <p>Escolha a proposta, escreva de 15 a 20 linhas e envie. O professor corrige nos 4 critérios da AOCP. Neste mês você enviou <b>{usadas}</b> de <b>{limite}</b>.</p>
      </div>
      {!ativada ? (
        <p className="erro" role="alert">A redação ainda não foi ativada. Avise a equipe.</p>
      ) : usadas >= limite ? (
        <div className={s.vazio}>Você usou todas as redações deste mês. O limite volta no dia 1º. Enquanto isso, leia as <Link href="/aluno/redacao/modelos">redações-modelo</Link>.</div>
      ) : (
        <FormRedacao alunoId={perfil.id} slugInicial={slug} />
      )}
    </div>
  );
}
