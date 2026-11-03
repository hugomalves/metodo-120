import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { linkPdf } from '@/lib/arquivos';
import { NIVEIS } from '@/lib/assuntos';
import { CartaoResposta } from './CartaoResposta';
import s from '../../aluno.module.css';

type Sim = {
  id: string; codigo: string; tipo: string; n_questoes: number; prova_pdf_path: string | null;
  gabarito_pdf_path: string | null; correcao_video_url: string | null;
};
type Envio = { respostas: string; acertos: number; em_branco: number; conta_evolucao: boolean; enviado_em: string };

export default async function SimuladoPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ refazer?: string }> }) {
  const { id } = await params;
  const { refazer } = await searchParams;
  const { supabase, perfil } = await exigirCurso();

  const { data: simRaw } = await supabase
    .from('simulados').select('id, codigo, tipo, n_questoes, prova_pdf_path, gabarito_pdf_path, correcao_video_url').eq('id', id).maybeSingle();
  const sim = simRaw as Sim | null;
  if (!sim) notFound();

  const [{ data: enviosRaw }, { data: rascunho }, prova] = await Promise.all([
    supabase.from('envios').select('respostas, acertos, em_branco, conta_evolucao, enviado_em')
      .eq('aluno_id', perfil.id).eq('simulado_id', id).order('enviado_em', { ascending: false }),
    supabase.from('rascunhos_cartao').select('respostas').eq('aluno_id', perfil.id).eq('simulado_id', id).maybeSingle(),
    linkPdf(supabase, sim.prova_pdf_path),
  ]);
  const envios = (enviosRaw ?? []) as Envio[];
  const ultimo = envios[0];
  const mostrarCartao = !ultimo || refazer === '1';

  const cabecalho = (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: sim.tipo === 'completo' ? 'Simulados completos' : sim.tipo === 'diagnostico' ? 'Simulado diagnóstico' : 'Minissimulados', href: `/aluno/simulados?tipo=${sim.tipo}` }, { rotulo: sim.codigo }]} />
      <div className={s.cabeca}>
        <span className="mono suave" style={{ fontSize: 13 }}>{sim.codigo} · {sim.n_questoes} questões</span>
        <h1 className={`display ${s.titulo}`}>{mostrarCartao ? 'Cartão-resposta' : 'Seu resultado'}</h1>
      </div>
    </>
  );

  if (!ultimo || refazer === '1') {
    return (
      <>
        {cabecalho}
        <p className="suave" style={{ margin: 0, maxWidth: '62ch' }}>
          {ultimo
            ? 'Você já enviou este simulado. Pode refazer para treinar, mas esta tentativa não conta para a sua evolução nem para o ranking.'
            : 'Resolva no PDF impresso e marque aqui. Salvamos enquanto você marca. Só o primeiro envio conta para a sua evolução e para o ranking.'}
        </p>
        {prova && <a href={prova} target="_blank" rel="noopener" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Baixar a prova (PDF)</a>}
        <CartaoResposta
          simuladoId={sim.id}
          alunoId={perfil.id}
          n={sim.n_questoes}
          inicial={ultimo ? '' : String(rascunho?.respostas ?? '')}
          salvarRascunho={!ultimo}
        />
      </>
    );
  }

  // resultado do envio mais recente, com gabarito e habilidades
  const [{ data: gabRows }, gabPdf] = await Promise.all([
    supabase.rpc('ver_correcao', { p_simulado: id }),
    linkPdf(supabase, sim.gabarito_pdf_path),
  ]);
  // (enquanto a atualização 0005 do banco não roda, usa a função antiga)
  const gabFinal = gabRows ?? (await supabase.rpc('ver_gabarito', { p_simulado: id })).data;
  const gab = ((gabFinal ?? []) as { respostas: string; habilidades: string[]; assuntos: string[]; niveis: string[]; comentarios: string[] }[])[0];
  const certa = gab?.respostas ?? '';
  const habs = gab?.habilidades ?? [];
  const assuntos = gab?.assuntos ?? [];
  const niveis = gab?.niveis ?? [];
  const comentarios = gab?.comentarios ?? [];
  const erradas = Array.from({ length: sim.n_questoes }, (_, i) => i).filter((i) => ultimo.respostas[i] !== certa[i]);

  const errosPorHab = new Map<string, number>();
  for (let i = 0; i < sim.n_questoes; i++) {
    const r = ultimo.respostas[i];
    if (r !== '-' && r !== certa[i] && habs[i]) errosPorHab.set(habs[i], (errosPorHab.get(habs[i]) ?? 0) + 1);
  }
  const sugestoes = Array.from(errosPorHab.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const erros = sim.n_questoes - ultimo.acertos - ultimo.em_branco;
  const primeiro = envios.find((e) => e.conta_evolucao);

  return (
    <>
      {cabecalho}
      <div className={`cartao-gradiente ${s.resultado}`}>
        <div><span className="rotulo">Acertos</span><b>{ultimo.acertos}</b></div>
        <div><span className="rotulo">Erros</span><b>{erros}</b></div>
        <div><span className="rotulo">Em branco</span><b>{ultimo.em_branco}</b></div>
        <p style={{ margin: 0, flex: '1 1 260px', minWidth: 0, color: 'var(--texto-2)', fontSize: 15 }}>
          {ultimo.conta_evolucao
            ? 'Este é o seu primeiro envio: ele conta para a evolução e o ranking.'
            : `Tentativa de treino. O envio que conta é o primeiro, com ${primeiro?.acertos ?? '–'} acertos.`}
          {' '}Contorno ciano: resposta certa. Laranja: a que você marcou e errou.
        </p>
      </div>

      <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="estudar">
        <h2 id="estudar" className="display" style={{ margin: 0, fontSize: 19 }}>O que estudar agora</h2>
        {sugestoes.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>
            {habs.length ? 'Nenhum erro nas questões que você respondeu. Siga em frente na trilha.' : 'As habilidades deste simulado ainda não foram cadastradas.'}
          </p>
        ) : (
          sugestoes.map(([h, n]) => (
            <div key={h} className="linha-flex" style={{ borderTop: '1px solid var(--linha)', paddingTop: 10 }}>
              <span className={s.selo} style={{ background: 'var(--laranja)', color: 'var(--tinta)' }}>{h}</span>
              <span style={{ flex: '1 1 220px', minWidth: 0 }}>{n} {n === 1 ? 'erro' : 'erros'} em questões desta habilidade</span>
              <Link href={`/aluno/habilidade/${h}`} className="btn btn-linha">Ver aulas da {h}</Link>
            </div>
          ))
        )}
        <div className="linha-flex">
          {gabPdf && <a href={gabPdf} target="_blank" rel="noopener" className="btn btn-azul">Gabarito comentado (PDF)</a>}
          {sim.correcao_video_url && <a href={sim.correcao_video_url} target="_blank" rel="noopener" className="btn btn-linha">Vídeo da correção</a>}
          <Link href={`/aluno/simulado/${id}?refazer=1`} className="btn btn-linha">Refazer (não conta)</Link>
        </div>
      </section>

      {erradas.length > 0 && (
        <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }} aria-labelledby="revisar">
          <h2 id="revisar" className="display" style={{ margin: '0 0 8px', fontSize: 19 }}>Questões para revisar</h2>
          {erradas.map((i) => (
            <div key={i} className="linha-flex" style={{ borderTop: '1px solid var(--linha)', paddingBlock: 10, alignItems: 'flex-start' }}>
              <span className="mono" style={{ width: 44, fontWeight: 700 }}>Q{i + 1}</span>
              <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="suave" style={{ fontSize: 14 }}>
                  {[ultimo.respostas[i] === '-' ? 'Em branco' : `Você marcou ${ultimo.respostas[i]}`, `certa: ${certa[i]}`, assuntos[i], habs[i], NIVEIS[niveis[i]]].filter(Boolean).join(' · ')}
                </span>
                {comentarios[i] && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comentarios[i]}</p>}
              </div>
              <Link href={`/aluno/duvidas?ctx=${encodeURIComponent(`${sim.codigo} · questão ${i + 1}`)}`} className="btn btn-linha" style={{ minHeight: 38, fontSize: 14 }}>Perguntar ao professor</Link>
            </div>
          ))}
        </section>
      )}

      <div className={`cartao ${s.cartao}`} aria-label="Suas respostas">
        {Array.from({ length: sim.n_questoes }, (_, i) => (
          <div key={i} className={s.questao}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {['A', 'B', 'C', 'D', 'E'].map((L) => {
              const marcou = ultimo.respostas[i] === L;
              const eCerta = certa[i] === L;
              const classe = [s.alt, marcou && eCerta ? s.altMarcada : '', marcou && !eCerta ? s.altErrada : '', eCerta ? s.altCerta : ''].join(' ');
              return <span key={L} className={classe} style={{ display: 'grid', placeItems: 'center', cursor: 'default' }} aria-label={`Questão ${i + 1}, ${L}${eCerta ? ', certa' : ''}${marcou ? ', marcada' : ''}`}>{L}</span>;
            })}
          </div>
        ))}
      </div>
    </>
  );
}
