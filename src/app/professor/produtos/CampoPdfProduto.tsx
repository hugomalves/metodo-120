'use client';

import { useState, type ChangeEvent } from 'react';
import { enviarPdfProduto } from '@/lib/upload';

// Campo "PDF do curso": envia assim que você escolhe o arquivo; ao salvar o produto, quem comprar recebe esse PDF com a marca d'água
export function CampoPdfProduto({ id, atual }: { id: string; atual: string | null }) {
  const [caminho, setCaminho] = useState('');
  const [nome, setNome] = useState('');
  const [remover, setRemover] = useState(false);
  const [estado, setEstado] = useState<{ enviando?: boolean; erro?: string; ok?: string }>({});

  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEstado({ enviando: true });
    try {
      setCaminho(await enviarPdfProduto(arquivo));
      setNome(arquivo.name);
      setRemover(false);
      setEstado({ ok: 'PDF enviado. Clique em Salvar para publicar.' });
    } catch (err) {
      setCaminho('');
      setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar o PDF.' });
    }
  }

  return (
    <div className="campo" style={{ gridColumn: 'span 2' }}>
      <label htmlFor={`pdf-${id}`}>PDF do curso (quem comprar recebe com nome, CPF e telefone em todas as páginas)</label>
      <input id={`pdf-${id}`} type="file" accept="application/pdf" onChange={aoEscolher} style={{ paddingBlock: 10 }} />
      <input type="hidden" name="pdf_path" value={caminho} />
      <input type="hidden" name="pdf_nome" value={nome} />
      {atual && !caminho && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="suave">PDF atual: {atual}.</span>
          <input type="checkbox" name="remover_pdf" checked={remover} onChange={(e) => setRemover(e.target.checked)} /> Tirar o PDF
        </label>
      )}
      {estado.enviando && <span className="suave" role="status">Enviando… (arquivos grandes demoram um pouco)</span>}
      {estado.erro && <span className="erro" role="alert">{estado.erro}</span>}
      {estado.ok && <span className="ok" role="status">{estado.ok}</span>}
    </div>
  );
}
