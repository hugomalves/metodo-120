import { redirect } from 'next/navigation';
import { areaDe } from '@/lib/sessao';
import { acessoAtual } from '@/lib/acesso';
import { Marca } from '@/components/Marca';
import { SemanaZero } from './SemanaZero';

export const metadata = { title: 'Boas-vindas' };

export default async function BoasVindas() {
  const { supabase, perfil, acesso } = await acessoAtual();
  if (perfil.papel !== 'aluno' || perfil.onboarding_ok) redirect(areaDe(perfil));
  // quem ainda não tem o curso vai direto para o banco de questões
  if (!acesso.curso) redirect('/aluno');

  // turma mais recente em que a pessoa está matriculada (se houver)
  const { data: mat } = await supabase
    .from('matriculas')
    .select('turma:turmas(nome, inicio)')
    .eq('aluno_id', perfil.id)
    .eq('status', 'ativa')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const turma = (mat?.turma as unknown as { nome: string; inicio: string } | null) ?? null;
  const inicio = turma ? new Date(turma.inicio + 'T12:00:00').toLocaleDateString('pt-BR') : null;

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <header className="topo">
        <Marca href="/boas-vindas" />
        <span className="mono suave" style={{ fontSize: 13 }}>Semana zero</span>
      </header>
      <SemanaZero nome={perfil.nome} turma={turma ? `${turma.nome} · começa em ${inicio}` : null} />
    </div>
  );
}
