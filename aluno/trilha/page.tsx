import { exigirCurso } from '@/lib/acesso';
import { carregarTrilha } from '@/lib/conteudo';
import { linksCapas } from '@/lib/capas';
import { AulasTela } from './AulasTela';

export const metadata = { title: 'Aulas' };

export default async function AulasPagina() {
  const { supabase, perfil } = await exigirCurso();
  const [trilha, { data: eds }] = await Promise.all([
    carregarTrilha(supabase, perfil),
    perfil.edital_id
      ? supabase.from('edital_disciplinas').select('disciplina, ordem').eq('edital_id', perfil.edital_id).order('ordem')
      : Promise.resolve({ data: [] }),
  ]);
  const capas = await linksCapas(supabase, trilha.modulos.map((m) => m.capa_path));
  return <AulasTela trilha={trilha} eds={(eds ?? []) as { disciplina: string }[]} capas={capas} />;
}
