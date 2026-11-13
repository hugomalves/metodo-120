'use client';

import { useState, type ChangeEvent } from 'react';
import { enviarVideoCurso } from '@/lib/upload';

// Um dos três vídeos: envia assim que você escolhe o arquivo e guarda o caminho para salvar junto
export function CampoVideoCurso({ chave, titulo, ajuda, url }: { chave: string; titulo: string; ajuda: string; url: string | null }) {
  const [caminho, setCaminho] = useState('');
  const [previa, setPrevia] = useState<string | null>(url);
  const [remover, setRemover] = useState(false);
  const [estado, setEstado] = useState<{ enviando?: boolean; erro?: string; ok?: string }>({});

  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEstado({ enviando: true });
    try {
      const novo = await enviarVideoCurso(arquivo);
      setCaminho(novo);
      setRemover(false);
      setPrevia(URL.createObjectURL(arquivo));
      setEstado({ ok: 'Vídeo enviado. Clique em Salvar para publicar.' });
    } catch (err) {
      setCaminho('');
      setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar o vídeo.' });
    }
  }

  return (
    <div className="campo">
      <label htmlFor={`v-${chave}`}>{titulo}</label>
      <span className="suave" style={{ fontSize: 14 }}>{ajuda} MP4 ou WebM, até 8 MB, de 5 a 15 segundos.</span>
      <input id={`v-${chave}`} type="file" accept="video/mp4,video/webm" onChange={aoEscolher} style={{ paddingBlock: 10 }} />
      <input type="hidden" name={`caminho_${chave}`} value={caminho} />
      {previa && !remover && (
        <div className="linha-flex" style={{ marginTop: 8, alignItems: 'flex-start' }}>
          <video src={previa} muted loop playsInline autoPlay style={{ width: 220, aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 4, background: '#071A3D' }} />
          {url && !caminho && (
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" name={`remover_${chave}`} checked={remover} onChange={(e) => setRemover(e.target.checked)} /> Tirar este vídeo
            </label>
          )}
        </div>
      )}
      {previa && remover && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input type="checkbox" name={`remover_${chave}`} checked={remover} onChange={(e) => setRemover(e.target.checked)} /> Tirar este vídeo (desmarque para manter)
        </label>
      )}
      {estado.enviando && <span className="suave" role="status">Enviando…</span>}
      {estado.erro && <span className="erro" role="alert">{estado.erro}</span>}
      {estado.ok && <span className="ok" role="status">{estado.ok}</span>}
    </div>
  );
}
