'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { apagarArquivoRedacao, enviarArquivoRedacao } from '@/lib/upload';
import { COMANDO, LINHAS_MAX, LINHAS_MIN, ORIGEM_ROTULO, PROPOSTAS, contarPalavras, estimarLinhas, propostaPorSlug, situacaoLinhas } from '@/lib/redacao';
import { enviarRedacao } from '../acoes';
import s from '../redacao.module.css';

const LIVRE = '__livre';
const GRUPOS = (['treino', 'prova', 'curso'] as const).map((o) => ({ o, itens: PROPOSTAS.filter((p) => p.origem === o) }));

// Nova redação: escolhe a proposta, digita (com contagem de linhas) ou envia PDF/foto da folha
export function FormRedacao({ alunoId, slugInicial = '' }: { alunoId: string; slugInicial?: string }) {
  const [slug, setSlug] = useState(propostaPorSlug(slugInicial) ? slugInicial : PROPOSTAS[0].slug);
  const [temaLivre, setTemaLivre] = useState('');
  const [modo, setModo] = useState<'digitar' | 'arquivo'>('digitar');
  const [texto, setTexto] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState('');
  const [etapa, setEtapa] = useState('');
  const [pendente, iniciar] = useTransition();
  const proposta = slug === LIVRE ? null : propostaPorSlug(slug);
  const linhas = estimarLinhas(texto);
  const situacao = situacaoLinhas(linhas);

  function escolher(f: File | null) {
    setErro('');
    if (f && f.size > 10 * 1024 * 1024) { setErro('O arquivo pode ter até 10 MB. Se for foto, tire com qualidade menor ou envie em PDF.'); setArquivo(null); return; }
    setArquivo(f);
  }

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    setErro('');
    if (modo === 'arquivo' && !arquivo) { setErro('Escolha o arquivo da redação.'); return; }
    if (modo === 'digitar' && texto.trim().length < 200) { setErro('A redação está muito curta. Escreva o texto completo (de 15 a 20 linhas).'); return; }
    iniciar(async () => {
      let caminho = '';
      try {
        if (modo === 'arquivo' && arquivo) {
          setEtapa('Enviando o arquivo…');
          caminho = await enviarArquivoRedacao(alunoId, arquivo);
          dados.set('arquivo_path', caminho);
          dados.delete('texto');
        }
        setEtapa('Registrando…');
        const r = await enviarRedacao({}, dados);   // se der certo, a página muda sozinha
        if (r?.erro) { setErro(r.erro); if (caminho) await apagarArquivoRedacao(caminho); }
      } catch (x) {
        // o redirecionamento do servidor também chega aqui: deixa passar
        if (x && typeof x === 'object' && 'digest' in x && String((x as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) throw x;
        setErro(x instanceof Error ? x.message : 'Não foi possível enviar.');
        if (caminho) await apagarArquivoRedacao(caminho).catch(() => {});
      }
      setEtapa('');
    });
  }

  return (
    <form onSubmit={enviar} className={s.novaGrade}>
      <div className={`${s.painel} ${s.form}`}>
        <div className="campo">
          <label htmlFor="rp">Proposta</label>
          <select id="rp" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {GRUPOS.map((g) => (
              <optgroup key={g.o} label={ORIGEM_ROTULO[g.o]}>
                {g.itens.map((p) => <option key={p.slug} value={p.slug}>{p.tema}</option>)}
              </optgroup>
            ))}
            <option value={LIVRE}>Outro tema (escrever o tema)</option>
          </select>
          <input type="hidden" name="proposta" value={proposta?.slug ?? ''} />
        </div>
        {slug === LIVRE && (
          <div className="campo">
            <label htmlFor="rt">Tema</label>
            <input id="rt" name="tema" maxLength={200} required value={temaLivre} onChange={(e) => setTemaLivre(e.target.value)} placeholder="Escreva o tema exatamente como está na proposta" />
          </div>
        )}

        <div role="radiogroup" aria-label="Como você vai enviar" className={s.modos}>
          <label className={s.modo} data-ativo={modo === 'digitar'}>
            <input type="radio" name="modo_escolha" checked={modo === 'digitar'} onChange={() => setModo('digitar')} />
            <b>Digitar aqui</b><span>Escreva no site, com contagem de linhas</span>
          </label>
          <label className={s.modo} data-ativo={modo === 'arquivo'}>
            <input type="radio" name="modo_escolha" checked={modo === 'arquivo'} onChange={() => setModo('arquivo')} />
            <b>Enviar PDF ou foto</b><span>A folha escrita à mão, como na prova</span>
          </label>
        </div>

        {modo === 'digitar' ? (
          <div className="campo">
            <label htmlFor="rx">Sua redação</label>
            <textarea id="rx" name="texto" className={s.editor} maxLength={6000} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder={'Escreva aqui, em 4 parágrafos:\n• introdução com a sua tese\n• dois parágrafos de argumento\n• conclusão que fecha o raciocínio\n\nNão escreva seu nome nem assine: na prova, isso zera a redação.'} />
            <div className={s.contador} aria-live="polite">
              <span className={s.linhasSelo} data-s={texto.trim() ? situacao : 'curta'}>≈ {linhas} {linhas === 1 ? 'linha' : 'linhas'} na folha</span>
              <span><b>{contarPalavras(texto)}</b> palavras</span>
              <span>Meta: {LINHAS_MIN} a {LINHAS_MAX} linhas</span>
            </div>
            <p className={s.ajuda}>A contagem é uma estimativa: cerca de 10 palavras por linha escrita à mão, e cada parágrafo começa numa linha nova.</p>
          </div>
        ) : (
          <div className="campo">
            <label htmlFor="rf">Arquivo da redação (PDF, JPG ou PNG, até 10 MB)</label>
            <input id="rf" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => escolher(e.target.files?.[0] ?? null)} />
            <p className={s.ajuda}>Fotografe a folha inteira, de cima, com boa luz e sem sombra. Use caneta azul ou preta, como na prova. Várias páginas? Junte tudo num PDF só (o app de scanner do celular faz isso).</p>
          </div>
        )}

        <p className={s.ajuda}>Depois de corrigida, a redação não pode ser apagada. Antes disso, você pode excluí-la, mas o envio do mês não volta.</p>
        <div className="linha-flex">
          <button className={s.btVerde} disabled={pendente}>{pendente ? etapa || 'Enviando…' : 'Enviar para correção'}</button>
          {erro && <span role="alert" className="erro">{erro}</span>}
        </div>
      </div>

      <aside className={s.lateral} aria-label="Proposta escolhida">
        {proposta ? (
          <div className={s.painel}>
            <span className={s.origem} data-o={proposta.origem}>{ORIGEM_ROTULO[proposta.origem]}</span>
            <h3>{proposta.tema}</h3>
            {proposta.texto ? <p className={s.motivador}>{proposta.texto}</p>
              : <p className="suave" style={{ margin: 0 }}>Os textos de apoio desta proposta estão no PDF do curso.</p>}
            {proposta.pdfs && <a className="btn btn-linha" href={`/api/curso-pdf/${proposta.pdfs.proposta}`} target="_blank" rel="noopener">Abrir a proposta em PDF</a>}
            <p className={s.ajuda}>{COMANDO}</p>
          </div>
        ) : (
          <div className={s.painel}><h3>Tema livre</h3><p className={s.ajuda}>Escreva o tema como ele aparece na proposta que você está treinando. {COMANDO}</p></div>
        )}
      </aside>
    </form>
  );
}
