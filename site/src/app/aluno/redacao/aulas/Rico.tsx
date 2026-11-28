import { Fragment, type ReactNode } from 'react';

// Texto das aulas: **negrito**, ~~riscado~~ e quebra de linha (\n)
export function rico(texto: string): ReactNode {
  return texto.split('\n').map((linha, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {linha.split(/(\*\*[^*]+\*\*|~~[^~]+~~)/g).map((parte, j) => {
        if (parte.startsWith('**') && parte.endsWith('**')) return <strong key={j}>{parte.slice(2, -2)}</strong>;
        if (parte.startsWith('~~') && parte.endsWith('~~')) return <s key={j}>{parte.slice(2, -2)}</s>;
        return <Fragment key={j}>{parte}</Fragment>;
      })}
    </Fragment>
  ));
}
