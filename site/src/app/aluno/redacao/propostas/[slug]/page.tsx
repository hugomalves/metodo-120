import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { COMANDO, ORIGEM_ROTULO, propostaPorSlug } from '@/lib/redacao';
import { AbasRedacao } from '../../AbasRedacao';
import s from '../../redacao.module.css';

export const metadata = { title: 'Proposta de redação' };

export default async function PropostaPagina({ params }: { params: Promise<{ slug: string }> }) {
  await exigirCurso();
  const p = propostaPorSlug((await params).slug);
  if (!p) notFound();
  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Propostas', href: '/aluno/redacao/propostas' }, { rotulo: 'Proposta' }]} />
      <AbasRedacao ativa="propostas" />
      <article className={s.folha}>
        <span className={s.origem} data-o={p.origem}>{ORIGEM_ROTULO[p.origem]}</span>
        {p.texto ? (
          <>
            <h2>Texto motivador</h2>
            <p className={s.motivador}>{p.texto}</p>
            {p.fontes && <p className={s.fonte}>Adaptado de {p.fontes.map((f, i) => <span key={f.url}>{i > 0 && ' e '}<a href={f.url} target="_blank" rel="noopener">{f.rotulo}</a></span>)}.</p>}
          </>
        ) : (
          <p className="suave" style={{ margin: 0 }}>Os textos de apoio desta proposta estão no PDF do Reta Final, com a folha de redação para imprimir.</p>
        )}
        <h2>Proposta</h2>
        <p className={s.comando}>{COMANDO}</p>
        <h2>Tema</h2>
        <p className={s.temaGrande}>{p.tema}</p>
        <div className="linha-flex">
          <Link href={`/aluno/redacao/nova?tema=${p.slug}`} className={s.btVerde}>Escrever sobre este tema</Link>
          {p.pdfs && (
            <>
              <a className="btn btn-linha" href={`/api/curso-pdf/${p.pdfs.proposta}`} target="_blank" rel="noopener">Proposta e folha em PDF</a>
              <a className="btn btn-linha" href={`/api/curso-pdf/${p.pdfs.modelo}`} target="_blank" rel="noopener">Redação-modelo comentada</a>
            </>
          )}
        </div>
        <p className={s.ajuda}>Dica: antes de escrever, anote a tese e os dois argumentos. Use o texto motivador como ponto de partida, mas não copie trechos dele.</p>
      </article>
    </div>
  );
}
