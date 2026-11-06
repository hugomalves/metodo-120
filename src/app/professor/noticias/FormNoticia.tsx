'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { salvarNoticia, type Resultado } from '../actions';
import { enviarImagemVitrine } from '@/lib/upload';
import styles from '../professor.module.css';

export type Noticia = {
  id: string; rotulo: string | null; titulo: string; resumo: string | null; link: string | null; botao: string | null;
  imagem_path: string | null; imagem?: string | null; ordem: number; publicada: boolean; publicada_em: string;
};

export function FormNoticia({ n }: { n?: Noticia }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Resultado>({});
  const [pendente, iniciar] = useTransition();

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    iniciar(async () => {
      setEstado({});
      try {
        const img = dados.get('imagem');
        if (img instanceof File && img.size > 0) dados.set('imagem_path', await enviarImagemVitrine(img));
        dados.delete('imagem');
        const r = await salvarNoticia({}, dados);
        setEstado(r);
        if (r.ok) { if (!n) form.reset(); router.refresh(); }
      } catch (err) {
        setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar.' });
      }
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {n && <input type="hidden" name="id" value={n.id} />}
      <div className={styles.campos}>
        <div className="campo"><label htmlFor={`nr${n?.id ?? ''}`}>Etiqueta</label><input id={`nr${n?.id ?? ''}`} name="rotulo" maxLength={30} defaultValue={n?.rotulo ?? ''} placeholder="Edital aberto" /></div>
        <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor={`nt${n?.id ?? ''}`}>Título</label><input id={`nt${n?.id ?? ''}`} name="titulo" required maxLength={120} defaultValue={n?.titulo ?? ''} placeholder="PM PE 2026: 1.250 vagas para Soldado" /></div>
        <div className="campo"><label htmlFor={`no${n?.id ?? ''}`}>Ordem</label><input id={`no${n?.id ?? ''}`} name="ordem" type="number" min={0} max={99} defaultValue={n?.ordem ?? 1} /></div>
      </div>
      <div className="campo"><label htmlFor={`ns${n?.id ?? ''}`}>Texto curto (até 280 caracteres)</label><textarea id={`ns${n?.id ?? ''}`} name="resumo" rows={2} maxLength={280} defaultValue={n?.resumo ?? ''} /></div>
      <div className={styles.campos}>
        <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor={`nl${n?.id ?? ''}`}>Link do botão</label><input id={`nl${n?.id ?? ''}`} name="link" defaultValue={n?.link ?? ''} placeholder="https://… ou /entrar?modo=criar" /></div>
        <div className="campo"><label htmlFor={`nb${n?.id ?? ''}`}>Texto do botão</label><input id={`nb${n?.id ?? ''}`} name="botao" maxLength={30} defaultValue={n?.botao ?? ''} placeholder="Saiba mais" /></div>
        <div className="campo"><label htmlFor={`ni${n?.id ?? ''}`}>Imagem (opcional, até 2 MB)</label><input id={`ni${n?.id ?? ''}`} name="imagem" type="file" accept="image/png,image/jpeg,image/webp" style={{ paddingBlock: 10 }} /></div>
      </div>
      {n?.imagem && (
        <div className="linha-flex">
          <img src={n.imagem} alt="" style={{ height: 80, width: 'auto', borderRadius: 8 }} />
          <label className={styles.check}><input type="checkbox" name="remover_imagem" /> Tirar a imagem (volta a foto do expert)</label>
        </div>
      )}
      <label className={styles.check}><input type="checkbox" name="publicada" defaultChecked={n?.publicada ?? true} /> Publicada na vitrine</label>
      <div className="linha-flex">
        <button className="btn btn-azul" disabled={pendente}>{pendente ? 'Salvando…' : n ? 'Salvar' : 'Adicionar notícia'}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
