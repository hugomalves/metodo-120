import { Fragment, type ReactNode } from 'react';
import { ImagemQuestao } from '@/components/ImagemQuestao';

/*
  Texto das questões com uma marcação mínima:
  • parágrafos separados por linha em branco;
  • [[fig:1]] numa linha sozinha → figura 1 da questão (recorte da prova);
  • tabela: linhas começando e terminando com | (a 2ª linha |---|---| separa o cabeçalho, opcional):
      | Ano | Receita |
      |---|---|
      | 2023 | R$ 1.200,00 |
  • $$ … $$ → trecho matemático (dois cifrões, para não confundir com R$): \frac{a}{b}, x^{2}, x_{1}, \sqrt{x}, \sqrt[3]{x}, \cdot, \times, \pi,
    \leq, \geq, \neq, \approx, \infty, \text{…}; fora dele o texto é literal.
*/

const SIMBOLOS: Record<string, string> = {
  cdot: '·', times: '×', div: '÷', pi: 'π', leq: '≤', geq: '≥', le: '≤', ge: '≥', neq: '≠', approx: '≈', infty: '∞',
  alpha: 'α', beta: 'β', gamma: 'γ', theta: 'θ', Delta: 'Δ', mu: 'µ', pm: '±', degree: '°', circ: '°', percent: '%',
  rightarrow: '→', to: '→', Rightarrow: '⇒', in: '∈', cup: '∪', cap: '∩', overline: '', ldots: '…', cdots: '⋯',
};

type No = ReactNode;

// lê um grupo { … } a partir de s[i] === '{'; devolve [conteúdo, próxima posição]
function grupo(s: string, i: number): [string, number] {
  if (s[i] !== '{') {
    // argumento de um caractere (ex.: x^2)
    return [s[i] ?? '', i + 1];
  }
  let nivel = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') nivel++;
    else if (s[j] === '}') { nivel--; if (nivel === 0) return [s.slice(i + 1, j), j + 1]; }
  }
  return [s.slice(i + 1), s.length];
}

function mat(s: string, chave = 'm'): No[] {
  const out: No[] = [];
  let buf = '';
  let k = 0;
  const solta = () => { if (buf) { out.push(buf); buf = ''; } };
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|[{}%$,;! ])/.exec(s.slice(i));
      if (!m) { buf += c; i++; continue; }
      const cmd = m[1];
      i += m[0].length;
      if (cmd === ',' || cmd === ';' || cmd === ' ') { buf += ' '; continue; }
      if (cmd === '!') continue;
      if ('{}%$'.includes(cmd)) { buf += cmd; continue; }
      if (cmd === 'frac' || cmd === 'dfrac') {
        const [a, j] = grupo(s, i); const [b, j2] = grupo(s, j); i = j2; solta();
        out.push(<span key={`${chave}${k++}`} className="tr-frac"><span>{mat(a, `${chave}${k}a`)}</span><span>{mat(b, `${chave}${k}b`)}</span></span>);
        continue;
      }
      if (cmd === 'sqrt') {
        let indice = '';
        if (s[i] === '[') { const f = s.indexOf(']', i); indice = s.slice(i + 1, f); i = f + 1; }
        const [a, j] = grupo(s, i); i = j; solta();
        out.push(<span key={`${chave}${k++}`} className="tr-raiz">{indice && <sup className="tr-indice">{indice}</sup>}√<span className="tr-radicando">{mat(a, `${chave}${k}r`)}</span></span>);
        continue;
      }
      if (cmd === 'text' || cmd === 'mathrm' || cmd === 'textrm') {
        const [a, j] = grupo(s, i); i = j; buf += a; continue;
      }
      if (cmd === 'overline') {
        const [a, j] = grupo(s, i); i = j; solta();
        out.push(<span key={`${chave}${k++}`} style={{ textDecoration: 'overline' }}>{mat(a, `${chave}${k}o`)}</span>);
        continue;
      }
      buf += SIMBOLOS[cmd] ?? cmd;
      continue;
    }
    if (c === '^' || c === '_') {
      const [a, j] = grupo(s, i + 1); i = j; solta();
      const filho = mat(a, `${chave}${k}s`);
      out.push(c === '^' ? <sup key={`${chave}${k++}`}>{filho}</sup> : <sub key={`${chave}${k++}`}>{filho}</sub>);
      continue;
    }
    if (c === '{' || c === '}') { i++; continue; }
    buf += c;
    i++;
  }
  solta();
  return out;
}

// texto corrido: $$…$$ vira matemática
function linha(s: string, chave: string): No[] {
  const out: No[] = [];
  const partes = s.split(/(\$\$[\s\S]+?\$\$)/g);
  partes.forEach((p, n) => {
    if (!p) return;
    if (p.startsWith('$$') && p.endsWith('$$') && p.length > 4) out.push(<span key={`${chave}${n}`} className="tr-mat">{mat(p.slice(2, -2), `${chave}${n}`)}</span>);
    else out.push(<Fragment key={`${chave}${n}`}>{p}</Fragment>);
  });
  return out;
}

export function TextoInline({ texto }: { texto: string }) {
  return <>{linha(texto, 'i')}</>;
}

export function TextoRico({ texto, figuras = [], escalaFigura = 0.62 }: { texto: string; figuras?: string[]; escalaFigura?: number }) {
  const blocos = texto.replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="tr">
      {blocos.map((b, n) => {
        const fig = /^\[\[fig:(\d+)\]\]$/.exec(b);
        if (fig) {
          const src = figuras[parseInt(fig[1], 10) - 1];
          return src ? (
            <figure key={n} className="tr-figura"><ImagemQuestao src={src} alt={`Figura ${fig[1]} da questão`} escala={escalaFigura} /></figure>
          ) : null;
        }
        const tabela = tabelaDe(b);
        if (tabela) return <Tabela key={n} {...tabela} />;
        const fonte = /Disponível em:|Acesso em:|\(adaptado\)\.?$/i.test(b) && b.length < 400;
        return (
          <p key={n} className={fonte ? 'tr-fonte' : undefined}>
            {b.split('\n').map((l, j) => <Fragment key={j}>{j > 0 && <br />}{linha(l, `${n}-${j}-`)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
}

// bloco com todas as linhas entre | … | vira tabela
function tabelaDe(bloco: string): { cabecalho: string[] | null; linhas: string[][] } | null {
  const linhas = bloco.split('\n').map((l) => l.trim());
  if (linhas.length < 1 || !linhas.every((l) => l.startsWith('|') && l.endsWith('|') && l.length > 2)) return null;
  const celulas = (l: string) => l.slice(1, -1).split('|').map((c) => c.trim());
  const separador = (l: string) => /^\|(\s*:?-{2,}:?\s*\|)+$/.test(l);
  if (linhas.length >= 2 && separador(linhas[1])) {
    return { cabecalho: celulas(linhas[0]), linhas: linhas.slice(2).map(celulas) };
  }
  return { cabecalho: null, linhas: linhas.filter((l) => !separador(l)).map(celulas) };
}

const numerico = (c: string) => /^[-−+]?\s*(R\$\s*)?[\d.,]+\s*%?$/.test(c);

function Tabela({ cabecalho, linhas }: { cabecalho: string[] | null; linhas: string[][] }) {
  return (
    <div className="tr-tabela-caixa">
      <table className="tr-tabela">
        {cabecalho && <thead><tr>{cabecalho.map((c, i) => <th key={i} scope="col">{linha(c, `h${i}-`)}</th>)}</tr></thead>}
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i}>{l.map((c, j) => <td key={j} data-num={numerico(c) ? '' : undefined}>{linha(c, `c${i}-${j}-`)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// alternativa: pode ser texto (com $…$) ou só uma figura ([[fig:3]])
export function TextoAlternativa({ texto, figuras = [] }: { texto: string; figuras?: string[] }) {
  const fig = /^\s*\[\[fig:(\d+)\]\]\s*$/.exec(texto);
  if (fig) {
    const src = figuras[parseInt(fig[1], 10) - 1];
    return src ? <ImagemQuestao src={src} alt="Figura da alternativa" escala={0.55} semLink /> : null;
  }
  return <span>{texto.split('\n').map((l, j) => <Fragment key={j}>{j > 0 && <br />}{linha(l, `a${j}-`)}</Fragment>)}</span>;
}
