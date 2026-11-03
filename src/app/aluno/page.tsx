import { acessoAtual } from '@/lib/acesso';
import { InicioBanco } from './InicioBanco';

export const metadata = { title: 'Meu painel' };

// Início do aluno: edital que ele segue, plano de hoje e disciplinas (com ou sem o curso)
export default async function PainelAluno() {
  const { supabase, perfil, acesso } = await acessoAtual();
  return <InicioBanco supabase={supabase} perfil={perfil} acesso={acesso} />;
}
