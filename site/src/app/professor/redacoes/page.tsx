import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { iaConfigurada } from '@/lib/redacaoIA';
import { dataBR } from '@/lib/redacao';
import { FormAcao } from '../FormAcao';
import { AbasProfRedacao } from './AbasProfRedacao';
import { salvarLimite } from './acoes';
import r from '@/app/aluno/redacao/redacao.module.css';
import styles from '../professor.module.css';

export const metadata = { title: 'Redações · Painel do professor' };
export const dynamic = 'force-dynamic';

type R = { id: string; tema: string; status: string; arquivo_path: string | null; nota: number | null; zerada: boolean; enviada_em: string; corrigida_em: string | null; perfis: { nome: string | null } | null };
type IA = { redacao_id: string; status: string; nota: number | null; zerar: boolean };

export default async function RedacoesProfessor() {
  const supabase = await createClient();
  const [{ data, error }, lim] = await Promise.all([
    supabase.from('redacoes').select('id, tema, status, arquivo_path, nota, zerada, enviada_em, corrigida_em, perfis(nome)').order('enviada_em', { ascending: true }).limit(400),
    supabase.rpc('redacoes_limite'),
  ]);
  const todas = (data ?? []) as unknown as R[];
  const fila = todas.filter((x) => x.status === 'enviada');
  const { data: iaRaw } = fila.length ? await supabase.from('redacoes_ia').select('redacao_id, status, nota, zerar').in('redacao_id', fila.map((x) => x.id)) : { data: [] };
  const ia = new Map(((iaRaw ?? []) as IA[]).map((x) => [x.redacao_id, x]));
  const feitas = todas.filter((x) => x.status === 'corrigida').sort((a, b) => (b.corrigida_em ?? '').localeCompare(a.corrigida_em ?? '')).slice(0, 30);
  const textoIA = (id: string) => {
    const x = ia.get(id);
    if (!x) return '';
    if (x.status === 'pronta') return x.zerar ? ' · IA sugere ZERAR' : ` · pré-correção da IA: ${x.nota}/40`;
    return x.status === 'erro' ? ' · a IA não conseguiu corrigir' : ' · IA corrigindo…';
  };

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Redações' }]} />
      <h1 className={`display ${styles.titulo}`}>Redações</h1>
      <AbasProfRedacao ativa="fila" />
      {error && <p className="erro" role="alert">Falta rodar o SQL da redação (0018) no Supabase.</p>}
      {!iaConfigurada() && <p className="suave" style={{ margin: 0 }}>Pré-correção por IA desligada: cadastre <code>GROQ_API_KEY</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> na Vercel e faça o Redeploy.</p>}

      <section className={`cartao ${styles.bloco}`} aria-labelledby="fila" style={{ borderColor: fila.length ? 'var(--ciano)' : undefined }}>
        <h2 id="fila" className="display">Para corrigir ({fila.length})</h2>
        {fila.length === 0 ? <p className="suave" style={{ margin: 0 }}>Nenhuma redação esperando correção.</p> : (
          <ul className={r.lista}>
            {fila.map((x) => (
              <li key={x.id}>
                <Link href={`/professor/redacoes/${x.id}`} className={r.item}>
                  <span className={r.itemTema}><b>{x.tema}</b><small>{x.perfis?.nome || 'Aluno'} · enviada em {dataBR(x.enviada_em)}{x.arquivo_path ? ' · em arquivo (PDF ou foto)' : ''}{textoIA(x.id)}</small></span>
                  <span className="btn btn-azul">{ia.get(x.id)?.status === 'pronta' ? 'Revisar' : 'Corrigir'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {feitas.length > 0 && (
        <section className={`cartao ${styles.bloco}`} aria-labelledby="feitas">
          <h2 id="feitas" className="display">Corrigidas recentemente</h2>
          <ul className={r.lista}>
            {feitas.map((x) => (
              <li key={x.id}>
                <Link href={`/professor/redacoes/${x.id}`} className={r.item}>
                  <span className={r.itemTema}><b>{x.tema}</b><small>{x.perfis?.nome || 'Aluno'}{x.corrigida_em ? ` · corrigida em ${dataBR(x.corrigida_em)}` : ''}</small></span>
                  <span className={r.selo}><b>{x.nota}</b><small>{x.zerada ? 'zerada' : 'de 40'}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`cartao ${styles.bloco}`} aria-labelledby="lim">
        <h2 id="lim" className="display">Redações por aluno, por mês</h2>
        <FormAcao acao={salvarLimite} botao="Salvar limite">
          <div className="campo" style={{ maxWidth: 220 }}>
            <label htmlFor="limite">Limite mensal</label>
            <input id="limite" name="limite" type="number" min={1} max={60} defaultValue={typeof lim.data === 'number' ? lim.data : 8} />
          </div>
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>Conta cada envio: apagar uma redação antes da correção não devolve a vaga. O mês vira no dia 1º, no horário de Brasília.</p>
        </FormAcao>
      </section>
    </>
  );
}
