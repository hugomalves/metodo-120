import { ehPdf } from '@/lib/redacaoArquivo';

// Mostra a redação enviada em arquivo: PDF embutido (com link para abrir) ou a foto da folha
export function ArquivoRedacao({ url, caminho }: { url: string | null; caminho: string }) {
  if (!url) return <p className="suave">Não foi possível abrir o arquivo agora. Recarregue a página.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <a className="btn btn-linha" style={{ alignSelf: 'flex-start' }} href={url} target="_blank" rel="noopener">Abrir {ehPdf(caminho) ? 'o PDF' : 'a foto'} em outra aba</a>
      {ehPdf(caminho)
        ? <object data={url} type="application/pdf" style={{ width: '100%', height: '75vh', border: '1px solid var(--linha)', borderRadius: 4 }} aria-label="Redação em PDF"><p className="suave">O navegador não mostra o PDF aqui. Use o botão acima.</p></object>
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={url} alt="Foto da folha de redação" style={{ width: '100%', height: 'auto', borderRadius: 4, border: '1px solid var(--linha)' }} />}
    </div>
  );
}
