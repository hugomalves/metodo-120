import { exigirCurso } from '@/lib/acesso';
import { VistaHome, type Media, type Red } from './VistaHome';

export const metadata = { title: 'Redação' };
export const dynamic = 'force-dynamic';

export default async function HomeRedacao() {
  const { supabase, perfil } = await exigirCurso();
  const [{ data, error }, lim, noMes, plat] = await Promise.all([
    supabase.from('redacoes').select('id, tema, status, nota, zerada, c1, c2, c3, c4, enviada_em').eq('aluno_id', perfil.id).order('enviada_em', { ascending: false }).limit(200),
    supabase.rpc('redacoes_limite'),
    supabase.rpc('redacoes_no_mes'),
    supabase.rpc('redacoes_media_plataforma'),
  ]);
  return (
    <VistaHome
      nome={perfil.nome?.split(' ')[0] || 'aluno'} erro={!!error} lista={(data ?? []) as Red[]}
      limite={typeof lim.data === 'number' ? lim.data : 8} usadas={typeof noMes.data === 'number' ? noMes.data : 0}
      plataforma={((plat.data ?? []) as Media[])[0] ?? null}
    />
  );
}
