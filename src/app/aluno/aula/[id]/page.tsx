import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirCurso } from '@/lib/acesso';
import { carregarTrilha, rotuloAula } from '@/lib/conteudo';
import { embedYoutube } from '@/lib/youtube';
import { linkPdf } from '@/lib/arquivos';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CaixaDuvida } from '../../CaixaDuvida';
import { concluirAula, desmarcarAula } from '../../actions';
import s from '../../aluno.module.css';

export default async function AulaPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await exigirCurso();
  const trilha = await carregarTrilha(supabase, perfil);

  const modulo = trilha.modulos.find((m) => m.aulas.some((a) => a.id === id));
  const aula = modulo?.aulas.find((a) => a.id === id);
  if (!modulo || !aula) notFound();

  // sequência de todas as aulas, para "anterior" e "próxima"
  const todas = trilha.modulos.flatMap((m) => m.aulas);
  const i = todas.findIndex((a) => a.id === id);
  const anterior = i > 0 ? todas[i - 1] : null;
  const proxima = i < todas.length - 1 ? todas[i + 1] : null;

  const video = embedYoutube(aula.video_url);
  // minissimulado da aula (questões em PDF + cartão) e se o aluno já enviou (libera o gabarito comentado)
  const { data: miniRaw } = await supabase.from('simulados').select('id, n_questoes').eq('aula_id', aula.id).eq('liberado', true).maybeSingle();
  const mini = miniRaw as { id: string; n_questoes: number } | null;
  const { count: enviou } = mini
    ? await supabase.from('envios').select('id', { count: 'exact', head: true }).eq('simulado_id', mini.id).eq('aluno_id', perfil.id)
    : { count: 0 };
  const pdf = await linkPdf(supabase, aula.pdf_path);

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Aulas', href: '/aluno/trilha' }, { rotulo: `Módulo ${modulo.numero}`, href: `/aluno/modulo/${modulo.id}` }, { rotulo: rotuloAula(aula) }]} />
      <div className={s.cabeca}>
        <span className="rotulo">{modulo.disciplina ? `${modulo.disciplina} · ` : ''}Módulo {modulo.numero} · {modulo.titulo}</span>
        <h1 className={`display ${s.titulo}`}>{rotuloAula(aula)} · {aula.titulo}</h1>
      </div>

      <div className={s.duas}>
        <div className={s.principal}>
          {video ? (
            <iframe
              className={s.video}
              src={video}
              title={`Vídeo: ${aula.titulo}`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : pdf ? (
            // aula em PDF (teoria + questões): o PDF abre aqui mesmo
            <iframe className={s.pdfAula} src={`${pdf}#view=FitH`} title={`PDF da aula: ${aula.titulo}`} />
          ) : (
            <div className={`cartao-gradiente ${s.semVideo}`}><span>O material desta aula será publicado em breve.</span></div>
          )}
          {/* os 3 arquivos da aula: teoria, minissimulado (questões + cartão) e gabarito comentado */}
          <div className="trio" aria-label="Arquivos da aula">
            <div className="trio-linha">
              <b>1 · PDF da aula (teoria + questões)</b>
              {pdf ? <a href={pdf} target="_blank" rel="noopener" className="btn btn-linha">Abrir o PDF</a> : <span className="suave">Em breve</span>}
            </div>
            <div className="trio-linha">
              <b>2 · Minissimulado{mini ? ` (${mini.n_questoes} questões)` : ''}</b>
              {mini ? <Link href={`/aluno/simulado/${mini.id}`} className="btn btn-azul">{enviou ? 'Ver o resultado' : 'Fazer o minissimulado'}</Link> : <span className="suave">Em breve</span>}
            </div>
            <div className="trio-linha">
              <b>3 · Gabarito comentado</b>
              {mini ? (enviou ? <Link href={`/aluno/simulado/${mini.id}`} className="btn btn-linha">Abrir o gabarito comentado</Link> : <span className="suave">Libera quando você envia o cartão do minissimulado</span>) : <span className="suave">Em breve</span>}
            </div>
          </div>
          <div className="linha-flex">
            {modulo.disciplina && (
              <Link href={`/aluno/questoes/listas?d=${encodeURIComponent(modulo.disciplina)}`} className="btn btn-linha">Treinar questões de {modulo.disciplina}</Link>
            )}
            {aula.concluida ? (
              <form action={desmarcarAula}>
                <input type="hidden" name="aula_id" value={aula.id} />
                <button className="btn" style={{ background: 'var(--ok-fundo)', color: 'var(--ok-texto)' }}>Aula concluída · desmarcar</button>
              </form>
            ) : (
              <form action={concluirAula}>
                <input type="hidden" name="aula_id" value={aula.id} />
                <input type="hidden" name="minutos" value={aula.duracao_min} />
                <button className="btn btn-azul btn-grande">Marcar como concluída</button>
              </form>
            )}
          </div>
          <CaixaDuvida aulaId={aula.id} titulo="Ficou com dúvida nesta aula?" />
          <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
            {anterior ? <Link href={`/aluno/aula/${anterior.id}`} className="btn btn-linha">← Aula anterior</Link> : <span />}
            {proxima && <Link href={`/aluno/aula/${proxima.id}`} className="btn btn-linha">Próxima aula →</Link>}
          </div>
        </div>

        <aside aria-label="Aulas do módulo" className={`cartao ${s.lateral}`}>
          <span className={s.rotuloPeq} style={{ padding: '0 8px 6px' }}>Aulas do módulo {modulo.numero}</span>
          {modulo.aulas.map((a) => (
            <Link key={a.id} href={`/aluno/aula/${a.id}`} aria-current={a.id === aula.id ? 'page' : undefined} className={`${s.itemLateral} ${a.id === aula.id ? s.itemAtual : ''}`}>
              <span style={{ fontWeight: 600 }}>{rotuloAula(a)}</span>
              <span className={`${s.chip} ${a.concluida ? s.chipOk : a.id === aula.id ? s.chipAgora : s.chipNeutro}`}>
                {a.concluida ? 'Concluída' : a.id === aula.id ? 'Agora' : 'A fazer'}
              </span>
            </Link>
          ))}
        </aside>
      </div>
    </>
  );
}
