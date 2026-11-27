import Link from 'next/link';
import { codigoPdfAula, type AulaRedacao, type Bloco } from '@/lib/redacaoAulas';
import { propostaPorSlug } from '@/lib/redacao';
import { rico } from '../Rico';
import s from '../../redacao.module.css';

function BlocoAula({ b }: { b: Bloco }) {
  switch (b.t) {
    case 'h': return <h2 className={s.aulaH}>{b.texto}</h2>;
    case 'p': return <p className={s.aulaP}>{rico(b.texto)}</p>;
    case 'lista': {
      const Tag = b.numerada ? 'ol' : 'ul';
      return <Tag className={s.aulaLista}>{b.itens.map((i, k) => <li key={k}>{rico(i)}</li>)}</Tag>;
    }
    case 'tabela': return (
      <div className={s.aulaTabelaRolagem}>
        <table className={s.aulaTabela}>
          <thead><tr>{b.cab.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>{b.linhas.map((l, k) => <tr key={k}>{l.map((c, j) => <td key={j}>{rico(c)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    case 'modelo': return <div className={s.aulaModelo}><b>{b.titulo}</b><p>{rico(b.texto)}</p></div>;
    case 'compara': return (
      <div className={s.aulaCompara}>
        <div data-tipo="ruim"><small>✗ Assim não</small><p>{rico(b.ruim)}</p></div>
        <div data-tipo="bom"><small>✓ Assim sim</small><p>{rico(b.bom)}</p></div>
        <p className={s.aulaPorque}>{rico(b.porque)}</p>
      </div>
    );
    case 'dica': return <div className={s.aulaDica}><b>Dica</b><p>{rico(b.texto)}</p></div>;
    case 'alerta': return <div className={s.aulaAlerta}><b>Atenção</b><p>{rico(b.texto)}</p></div>;
    case 'exercicio': return (
      <div className={s.aulaExercicio}>
        <b>Exercício</b>
        <p>{rico(b.enunciado)}</p>
        {b.itens && (/^[a-e]\)/.test(b.itens[0])
          ? <ul>{b.itens.map((i, k) => <li key={k}>{rico(i)}</li>)}</ul>
          : <ol>{b.itens.map((i, k) => <li key={k}>{rico(i)}</li>)}</ol>)}
        {b.linhas && <p className={s.ajuda}>Escreva no caderno ou numa folha pautada, à mão, antes de ver a resposta.</p>}
        <details><summary>Ver a resposta</summary><p>{rico(b.resposta)}</p></details>
      </div>
    );
  }
}

// Uma aula de "Redação do zero": cabeçalho, blocos, cola final e a redação da semana
export function VistaAula({ aula, feita }: { aula: AulaRedacao; feita: boolean }) {
  const proposta = propostaPorSlug(aula.tarefa.proposta);
  return (
    <article className={s.aula}>
      <header className={s.aulaCabeca}>
        <span className={s.heroRotulo}>Semana {aula.n} de 8 · {aula.minutos} min</span>
        <h1 className="display">{aula.titulo}</h1>
        <p><b>Objetivo:</b> {aula.objetivo}</p>
        <div className={s.chips} aria-label="Nesta aula você vai aprender">{aula.aprender.map((x) => <span key={x}>{x}</span>)}</div>
        <a href={`/api/curso-pdf/${codigoPdfAula(aula.n)}`} target="_blank" rel="noopener" className={s.btClaro}>Baixar esta aula em PDF</a>
      </header>
      <div className={s.aulaCorpo}>{aula.blocos.map((b, i) => <BlocoAula key={i} b={b} />)}</div>
      <section className={s.aulaLembrar} aria-labelledby="lembrar">
        <h2 id="lembrar">Para lembrar</h2>
        <ul>{aula.lembrar.map((x) => <li key={x}>{rico(x)}</li>)}</ul>
      </section>
      <section className={s.aulaTarefa} aria-labelledby="tarefa">
        <span className={s.heroRotulo}>Redação da semana {feita ? '· enviada ✓' : ''}</span>
        <h2 id="tarefa">{proposta?.tema ?? 'Redação da semana'}</h2>
        <p>{rico(aula.tarefa.texto)}</p>
        <div className={s.heroBotoes}>
          <Link href={`/aluno/redacao/nova?tema=${aula.tarefa.proposta}`} className={s.btVerde}>{feita ? 'Escrever outra vez' : 'Escrever a redação da semana'}</Link>
          <Link href={`/aluno/redacao/propostas/${aula.tarefa.proposta}`} className={s.btClaro}>Ver a proposta</Link>
        </div>
      </section>
    </article>
  );
}
