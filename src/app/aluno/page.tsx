import { acessoAtual } from '@/lib/acesso';
import { InicioBanco } from './InicioBanco';

export const metadata = { title: 'Meu painel' };

// Início do aluno: edital que ele segue, plano do dia (com os próximos dias clicáveis), PDFs e simulados
export default async function PainelAluno({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { dia } = await searchParams;
  const { supabase, perfil, acesso } = await acessoAtual();
  return <InicioBanco supabase={supabase} perfil={perfil} acesso={acesso} dia={dia} />;
}
