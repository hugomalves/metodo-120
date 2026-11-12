'use client';

import { useState, type ChangeEvent } from 'react';
import { enviarImagemProduto } from '@/lib/upload';

// Campo "Imagem do curso" do painel: envia a imagem assim que você escolhe o arquivo e guarda o caminho para salvar com o produto
export function CampoImagemProduto({ id, url, temImagem }: { id: string; url: string | null; temImagem: boolean }) {
  const [caminho, setCaminho] = useState('');
  const [previa, setPrevia] = useState<string | null>(url);
  const [remover, setRemover] = useState(false);
  const [estado, setEstado] = useState<{ enviando?: boolean; erro?: string; ok?: string }>({});

  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEstado({ enviando: true });
    try {
      const novo = await enviarImagemProduto(arquivo);
      setCaminho(novo);
      setRemover(false);
      setPrevia(URL.createObjectURL(arquivo));
      setEstado({ ok: 'Imagem enviada. Clique em Salvar para publicar.' });
    } catch (err) {
      setCaminho('');
      setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar a imagem.' });
    }
  }

  return (
    <div className="campo" style={{ gridColumn: 'span 2' }}>
      <label htmlFor={`pi-${id}`}>Imagem do curso (quadrada, até 2 MB)</label>
      <input id={`pi-${id}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={aoEscolher} style={{ paddingBlock: 10 }} />
      <input type="hidden" name="imagem_path" value={caminho} />
      {previa && !remover && (
        <div className="linha-flex" style={{ marginTop: 8 }}>
          <img src={previa} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 4 }} />
          {temImagem && (
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" name="remover_imagem" checked={remover} onChange={(e) => setRemover(e.target.checked)} /> Tirar a imagem (volta o quadrado com o nome)
            </label>
          )}
        </div>
      )}
      {estado.enviando && <span className="suave" role="status">Enviando…</span>}
      {estado.erro && <span className="erro" role="alert">{estado.erro}</span>}
      {estado.ok && <span className="ok" role="status">{estado.ok}</span>}
    </div>
  );
}
