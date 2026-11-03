import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarTrilha, rotuloAula } from '@/lib/conteudo';
import { HABILIDADES, codigoValido, competenciaDe, nivelDe } from '@/lib/habilidades';
import { embedYoutube } from '@/lib/youtube';
import { linkPdf } from '@/lib/arquivos';
import s from '../../aluno.module.css';

type Hab = { habilidade: string; acertos: number; total: number; pct: number };
type Material = { id: string; tipo: 'aula' | 'lista'; titulo: string; video_url: string | null; pdf_path: string | null; gabarito_pdf_path: string | null };

export default async function HabilidadePagina({ params }: { params: Promise<{ cod: string }> }) {
  const { cod: bruto } = await params;
  const cod = bruto.toUpperCase();
  if (!codigoValido(cod)) notFound();

  const { supabase, perfil } = await exigirCurso();
  const [trilha, { data }, { data: matsRaw }, { count: nQuestoes }] = await Promise.all([
    carregarTrilha(supabase, perfil),
    supabase.rpc('minhas_habilidades'),
    supabase.from('materiais_habilidade').select('id, tipo, titulo, video_url, pdf_path, gabarito_pdf_path')
      .eq('habilidade', cod).order('ordem').order('criado_em'),
    supabase.from('questoes').select('id', { count: 'exact', head: true }).eq('habilidade', cod).eq('area', 'matematica'),
  ]);
  const minha = ((data ?? []) as Hab[]).find((h) => h.habilidade === cod);
  const nivel = minha ? nivelDe(minha.pct) : null;
  const aulasTrilha = trilha.modulos.flatMap((m) => m.aulas.filter((a) => a.habilidades.includes(cod)).map((a) => ({ a, m })));
  const comp = competenciaDe(cod);

  const materiais = await Promise.all(
    ((matsRaw ?? []) as Material[]).map(async (m) => ({
      ...m,
      pdf: await linkPdf(supabase, m.pdf_path),
      gabarito: await linkPdf(supabase, m.gabarito_pdf_path),
      embed: embedYoutube(m.video_url),
    })),
  );
  const aulas = materiais.filter((m) => m.tipo === 'aula');
  const listas = materiais.filter((m) => m.tipo === 'lista');

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Habilidades', href: '/aluno/habilidades' }, { rotulo: cod }]} />
      <div className={s.cabeca}>
        <span className="rotulo">{comp ? `Competência ${comp.numero} · ${comp.nome}` : 'Habilidade'}</span>
        <h1 className={`display ${s.titulo}`}>{cod}</h1>
        <p style={{ margin: 0, maxWidth: '70ch', color: 'var(--texto-2)' }}>{HABILIDADES[cod]}</p>
      </div>

      <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className={s.rotuloPeq}>Seu nível nesta habilidade</span>
        {minha && nivel ? (
          <>
            <div className="linha-flex">
              <span className="display" style={{ fontSize: 30 }}>{minha.pct}%</span>
              <span className={s.chip} style={{ background: nivel.cor, color: nivel.texto }}>{nivel.rotulo}</span>
            </div>
            <span className={s.trilho}><span style={{ width: `${minha.pct}%`, background: nivel.cor }} /></span>
            <span className="suave" style={{ fontSize: 14 }}>{minha.acertos} acertos em {minha.total} questões desta habilidade nos seus simulados.</span>
          </>
        ) : (
          <span className="suave">Você ainda não respondeu questões desta habilidade nos simulados.</span>
        )}
      </section>

      <section className={s.grupo} aria-labelledby="aulas-hab">
        <h2 id="aulas-hab" className="display">Aulas da habilidade {cod}</h2>
        {aulas.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>As aulas desta habilidade serão publicadas em breve.</p>
        ) : (
          <div className={s.materiais}>
            {aulas.map((m) => (
              <div key={m.id} className={`cartao ${s.material}`}>
                {m.embed && (
                  <iframe className={s.video} src={m.embed} title={`Vídeo: ${m.titulo}`} loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                )}
                <strong className="display" style={{ fontSize: 17 }}>{m.titulo}</strong>
                {m.pdf && <a href={m.pdf} target="_blank" rel="noopener" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Abrir o PDF</a>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={s.grupo} aria-labelledby="listas">
        <h2 id="listas" className="display">Listas de exercícios</h2>
        {listas.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>As listas desta habilidade serão publicadas em breve.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listas.map((m) => (
              <div key={m.id} className={`cartao ${s.linhaLista}`}>
                <strong style={{ flex: '1 1 240px', minWidth: 0 }}>{m.titulo}</strong>
                {m.pdf && <a href={m.pdf} target="_blank" rel="noopener" className="btn btn-azul">Baixar a lista</a>}
                {m.gabarito && <a href={m.gabarito} target="_blank" rel="noopener" className="btn btn-linha">Gabarito</a>}
                {m.video_url && <a href={m.video_url} target="_blank" rel="noopener" className="btn btn-linha">Correção em vídeo</a>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={s.grupo} aria-labelledby="treinar">
        <h2 id="treinar" className="display">Treinar no banco de questões</h2>
        <div className={`cartao ${s.linhaLista}`}>
          <span style={{ flex: '1 1 240px', minWidth: 0 }}>
            {nQuestoes ? `${nQuestoes} questões da ${cod} no banco, com resolução comentada.` : 'As questões desta habilidade entram no banco em breve.'}
          </span>
          {!!nQuestoes && <Link href={`/aluno/questoes/listas?ar=matematica&h=${cod}`} className="btn btn-azul">Montar uma lista da {cod}</Link>}
          {!!nQuestoes && <Link href={`/aluno/questoes?h=${cod}`} className="btn btn-linha">Ver todas</Link>}
        </div>
      </section>

      {aulasTrilha.length > 0 && (
        <section className={s.grupo} aria-labelledby="aulas">
          <h2 id="aulas" className="display">Aulas da trilha que trabalham a {cod}</h2>
          {aulasTrilha.map(({ a, m }) => (
            <Link key={a.id} href={`/aluno/aula/${a.id}`} className={`cartao ${s.linhaLista}`} style={{ textDecoration: 'none', color: 'var(--texto)' }}>
              <span className="mono suave" style={{ width: 170 }}>Módulo {m.numero} · {rotuloAula(a)}</span>
              <strong style={{ flex: '1 1 240px', minWidth: 0 }}>{a.titulo}</strong>
              <span className={`${s.chip} ${a.concluida ? s.chipOk : s.chipNeutro}`}>{a.concluida ? 'Concluída' : 'A fazer'}</span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
