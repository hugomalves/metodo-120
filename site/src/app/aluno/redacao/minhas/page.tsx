import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { dataBR, faixaNota } from '@/lib/redacao';
import { AbasRedacao } from '../AbasRedacao';
import s from '../redacao.module.css';

export const metadata = { title: 'Minhas correções' };
export const dynamic = 'force-dynamic';

type R = { id: string; tema: string; status: string; nota: number | null; zerada: boolean; enviada_em: string; corrigida_em: string | null; arquivo_path: string | null };

export default async function Minhas() {
  const { supabase, perfil } = await exigirCurso();
  const { data } = await supabase.from('redacoes').select('id, tema, status, nota, zerada, enviada_em, corrigida_em, arquivo_path').eq('aluno_id', perfil.id).order('enviada_em', { ascending: false });
  const lista = (data ?? []) as R[];
  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Minhas correções' }]} />
      <AbasRedacao ativa="minhas" />
      <div className={s.cabeca}><h1 className="display">Minhas correções</h1><p>Todas as redações que você enviou, com a nota de 0 a 40.</p></div>
      {lista.length === 0 ? <div className={s.vazio}>Você ainda não enviou nenhuma redação. <Link href="/aluno/redacao/nova">Escrever a primeira</Link>.</div> : (
        <ul className={s.lista}>
          {lista.map((r) => (
            <li key={r.id}>
              <Link href={`/aluno/redacao/${r.id}`} className={s.item}>
                <span className={s.itemTema}><b>{r.tema}</b><small>Enviada em {dataBR(r.enviada_em)}{r.arquivo_path ? ' · em arquivo' : ''}{r.corrigida_em ? ` · corrigida em ${dataBR(r.corrigida_em)}` : ''}</small></span>
                {r.status === 'corrigida'
                  ? <span className={s.selo} data-tom={faixaNota(r.nota)?.tom}><b>{r.nota}</b><small>{r.zerada ? 'zerada' : 'de 40'}</small></span>
                  : <span className={s.espera}>Em correção</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
