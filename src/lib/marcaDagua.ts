import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

// A fonte padrão do PDF só tem caracteres latinos (acentos do português valem): troca o resto por "?"
const limpar = (t: string) => Array.from(t.normalize('NFC')).map((c) => (c.charCodeAt(0) <= 255 ? c : '?')).join('');

// Escreve em todas as páginas, na diagonal e repetido, o nome, o CPF e o telefone de quem comprou,
// e uma linha de licença no rodapé. Devolve o PDF novo (o original não é alterado).
export async function aplicarMarcaDagua(original: Uint8Array, d: { nome: string; cpf: string; telefone: string }): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const linha = limpar(`${d.nome.toUpperCase()} · CPF ${d.cpf} · Tel ${d.telefone}`);
  const licenca = limpar(`Material licenciado para ${d.nome} · CPF ${d.cpf} · Tel ${d.telefone} · Uso pessoal: proibido copiar, compartilhar ou revender.`);

  const tamanho = 13;
  const larguraLinha = fonte.widthOfTextAtSize(linha, tamanho);
  const ang = (35 * Math.PI) / 180;
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  const passoV = 150;
  const passoU = larguraLinha + 70;

  for (const pagina of pdf.getPages()) {
    const { width, height } = pagina.getSize();
    const diag = Math.hypot(width, height);
    for (let v = -diag; v < diag; v += passoV) {
      const deslocamento = (Math.abs(Math.round(v / passoV)) % 2) * (passoU / 2);
      for (let u = -diag + deslocamento; u < diag; u += passoU) {
        const x = u * c - v * sn;
        const y = u * sn + v * c;
        if (x < -larguraLinha || x > width + larguraLinha || y < -larguraLinha || y > height + larguraLinha) continue;
        pagina.drawText(linha, { x, y, size: tamanho, font: fonte, color: rgb(0.45, 0.45, 0.45), opacity: 0.17, rotate: degrees(35) });
      }
    }
    // rodapé de licença (reduz a letra se a página for estreita)
    let t = 7;
    while (t > 4 && fonte.widthOfTextAtSize(licenca, t) > width - 32) t -= 0.5;
    pagina.drawText(licenca, { x: 16, y: 10, size: t, font: fonte, color: rgb(0.3, 0.3, 0.3), opacity: 0.7 });
  }
  pdf.setSubject(limpar(`Licenciado para ${d.nome}`));
  return pdf.save();
}
