import { notFound } from 'next/navigation';
import { linkArquivoRedacao } from '@/lib/redacaoArquivo';
import { exigirCurso } from '@/lib/acesso';
import { VistaRedacao, type R } from './VistaRedacao';

export const metadata = { title: 'Redação' };
export const dynamic = 'force-dynamic';

export default async function RedacaoPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ enviada?: string }> }) {
  const { id } = await params;
  const enviada = (await searchParams).enviada === '1';
  const { supabase, perfil } = await exigirCurso();
  const { data } = await supabase.from('redacoes').select('*').eq('id', id).eq('aluno_id', perfil.id).maybeSingle();
  const r = data as R | null;
  if (!r) notFound();
  return <VistaRedacao r={r} arquivoUrl={await linkArquivoRedacao(supabase, r.arquivo_path)} enviada={enviada} />;
}
