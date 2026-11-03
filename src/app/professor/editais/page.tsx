import { createClient } from '@/lib/supabase/server';
import { EditaisTela, type Edital } from './EditaisTela';

export const metadata = { title: 'Editais · Painel do professor' };

export default async function Editais({ searchParams }: { searchParams: Promise<{ id?: string; novo?: string }> }) {
  const { id, novo } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('editais').select('*, edital_disciplinas(disciplina, questoes, bloco, peso, ordem)').order('data_prova', { nullsFirst: false });
  return <EditaisTela editais={(data ?? []) as Edital[]} id={id} novo={novo} />;
}
