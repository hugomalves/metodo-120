import { notFound } from 'next/navigation';
import { ArquivoRedacao } from '@/components/ArquivoRedacao';
import { linkArquivoRedacao } from '@/lib/redacaoArquivo';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { CRITERIOS, dataBR, estimarLinhas, propostaPorSlug } from '@/lib/redacao';
import { iaConfigurada } from '@/lib/redacaoIA';
import { FormAcao } from '../../FormAcao';
import { gerarPreCorrecao } from '../acoes';
import { FormCorrecao } from './FormCorrecao';
import r from '@/app/aluno/redacao/redacao.module.css';
import styles from '../../professor.module.css';

export const metadata = { title: 'Corrigir redação · Painel do professor' };
export const dynamic = 'force-dynamic';
export const maxDuration = 60;   // a pré-correção leva alguns segundos

type Red = {
  id: string; tema: string; proposta: string | null; texto: string | null; arquivo_path: string | null; status: string; enviada_em: string;
  c1: number | null; c2: number | null; c3: number | null; c4: number | null; zerada: boolean; motivo_zero: string | null;
  pontos_fortes: string | null; pontos_melhorar: string | null; comentarios: Record<string, string>; perfis: { nome: string | null } | null;
};
type IA = {
  status: 'pendente' | 'pronta' | 'erro'; c1: number | null; c2: number | null; c3: number | null; c4: number | null; nota: number | null; zerar: boolean; motivo_zero: string | null;
  comentarios: Record<string, string>; pontos_fortes: string | null; pontos_melhorar: string | null; alerta: string | null; modelo: string | null; erro: string | null;
};

export default async function CorrigirRedacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: iaRaw }] = await Promise.all([
    supabase.from('redacoes').select('*, perfis(nome)').eq('id', id).maybeSingle(),
    supabase.from('redacoes_ia').select('*').eq('redacao_id', id).maybeSingle(),
  ]);
  const red = data as unknown as Red | null;
  if (!red) notFound();
  const ia = iaRaw as IA | null;
  const arquivoUrl = await linkArquivoRedacao(supabase, red.arquivo_path);
  const proposta = propostaPorSlug(red.proposta);
  // ainda sem correção do professor: o formulário vem preenchido com a pré-correção da IA
  const usarIA = red.status === 'enviada' && ia?.status === 'pronta';
  const inicial = usarIA
    ? { notas: [ia!.c1, ia!.c2, ia!.c3, ia!.c4], comentarios: ia!.comentarios ?? {}, fortes: ia!.pontos_fortes ?? '', melhorar: ia!.pontos_melhorar ?? '', zerada: ia!.zerar, motivo: ia!.motivo_zero ?? '' }
    : { notas: [red.c1, red.c2, red.c3, red.c4], comentarios: red.comentarios ?? {}, fortes: red.pontos_fortes ?? '', melhorar: red.pontos_melhorar ?? '', zerada: red.zerada, motivo: red.motivo_zero ?? '' };
  const configurada = iaConfigurada();

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Redações', href: '/professor/redacoes' }, { rotulo: 'Corrigir' }]} />
      <h1 className={`display ${styles.titulo}`}>{red.tema}</h1>
      <p className="suave" style={{ margin: 0 }}>
        {red.perfis?.nome || 'Aluno'} · enviada em {dataBR(red.enviada_em)} · {red.status === 'corrigida' ? 'já corrigida (você pode ajustar)' : 'aguardando correção'}
        {red.texto ? ` · ≈ ${estimarLinhas(red.texto)} linhas na folha` : ''}
      </p>
      {proposta?.texto && (
        <details className="cartao" style={{ padding: '12px 16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Texto motivador da proposta</summary>
          <p style={{ margin: '10px 0 0', lineHeight: 1.6 }}>{proposta.texto}</p>
        </details>
      )}
      <div className={r.duas}>
        <article className={r.texto} aria-label="Texto do aluno">
          {red.arquivo_path ? <ArquivoRedacao url={arquivoUrl} caminho={red.arquivo_path} /> : (red.texto ?? '').split(/\n+/).filter((p) => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
        </article>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className={`cartao ${styles.bloco}`} aria-labelledby="ia-t">
            <h2 id="ia-t" className="display">Pré-correção da IA{ia?.status === 'pronta' && ia.nota !== null ? ` · ${ia.zerar ? 'sugere zerar' : `${ia.nota}/40`}` : ''}</h2>
            {red.arquivo_path && <p className="suave" style={{ margin: 0 }}>Redação enviada em arquivo: a IA gratuita não lê letra à mão, então corrija olhando o arquivo.</p>}
            {!red.arquivo_path && !ia && !configurada && <p className="suave" style={{ margin: 0 }}>Desligada. Cadastre <code>GROQ_API_KEY</code> na Vercel e faça o Redeploy.</p>}
            {!red.arquivo_path && !ia && configurada && <p className="suave" style={{ margin: 0 }}>Esta redação ainda não passou pela IA.</p>}
            {ia?.status === 'pendente' && <p className="suave" style={{ margin: 0 }}>A IA está corrigindo. Recarregue a página em alguns segundos.</p>}
            {ia?.status === 'erro' && <p className="erro" role="alert" style={{ margin: 0 }}>Não deu certo: {ia.erro}</p>}
            {ia?.status === 'pronta' && (
              <>
                {ia.alerta && <p className={r.zerada} role="alert" style={{ margin: 0 }}><b>Atenção:</b> {ia.alerta}</p>}
                {ia.zerar && <p style={{ margin: 0 }}><b>A IA sugere nota zero:</b> {ia.motivo_zero}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                  {CRITERIOS.map((c) => <div key={c.n} className="cartao" style={{ padding: '8px 10px', textAlign: 'center' }}><small className="suave">{c.nome}</small><div className="display" style={{ fontSize: 22 }}>{ia[`c${c.n}` as 'c1']}</div></div>)}
                </div>
                <p className="suave" style={{ margin: 0, fontSize: 13 }}>
                  {usarIA ? 'O formulário abaixo veio preenchido com estas notas e comentários. Revise antes de enviar: o aluno só vê o que você enviar.' : 'Você já corrigiu esta redação; a pré-correção fica só para comparar.'}
                  {ia.modelo ? ` · modelo ${ia.modelo}` : ''}
                </p>
              </>
            )}
            {configurada && !red.arquivo_path && (
              <FormAcao acao={gerarPreCorrecao} botao={ia ? 'Refazer a pré-correção' : 'Gerar pré-correção'}>
                <input type="hidden" name="id" value={red.id} />
              </FormAcao>
            )}
          </section>
          <section className={`cartao ${styles.bloco}`} aria-labelledby="cor-t">
            <h2 id="cor-t" className="display">Sua correção</h2>
            <FormCorrecao key={usarIA ? 'ia' : 'prof'} id={red.id} inicial={inicial} ehArquivo={!!red.arquivo_path} />
          </section>
        </div>
      </div>
    </>
  );
}
