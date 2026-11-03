'use client';

import { useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { enviarImagem } from '@/lib/upload';
import { definirCapa } from './actions';

// Troca a capa de um módulo ou simulado. Sem capa enviada, o aluno vê a capa automática da marca.
export function TrocarCapa({ alvo, id, temCapa, children }: {
  alvo: 'modulos' | 'simulados'; id: string; temCapa: boolean; children: ReactNode;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok?: string; erro?: string }>({});
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const salvar = (f: () => Promise<string | null>) => iniciar(async () => {
    setMsg({});
    try {
      const r = await definirCapa(alvo, id, await f());
      setMsg(r);
      if (r.ok) router.refresh();
    } catch (e) {
      setMsg({ erro: e instanceof Error ? e.message : 'Não foi possível enviar a imagem.' });
    }
  });

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: 168, aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--linha)', flex: '0 0 auto' }}>
        {children}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div className="linha-flex" style={{ gap: 8 }}>
          <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" hidden
            onChange={(e) => { const arq = e.target.files?.[0]; e.target.value = ''; if (arq) salvar(() => enviarImagem('capas', arq)); }} />
          <button type="button" className="btn btn-linha" style={{ minHeight: 36, fontSize: 14 }} disabled={pendente} onClick={() => entrada.current?.click()}>
            {pendente ? 'Salvando…' : temCapa ? 'Trocar capa' : 'Enviar capa própria'}
          </button>
          {temCapa && (
            <button type="button" className="btn btn-linha" style={{ minHeight: 36, fontSize: 14 }} disabled={pendente} onClick={() => salvar(async () => null)}>
              Usar capa automática
            </button>
          )}
        </div>
        <span className="suave" style={{ fontSize: 12.5 }}>PNG, JPG ou WebP até 3 MB, no formato 16:9 (ex.: 1280 × 720).</span>
        {msg.erro && <span role="alert" style={{ fontSize: 13, color: 'var(--erro)' }}>{msg.erro}</span>}
        {msg.ok && <span role="status" style={{ fontSize: 13, color: 'var(--ok-texto)' }}>{msg.ok}</span>}
      </div>
    </div>
  );
}
