'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { salvarMaterial, type Resultado } from '../../actions';
import { enviarPdf } from '@/lib/upload';
import styles from '../../professor.module.css';

export function FormMaterial({ habilidade }: { habilidade: string }) {
  const [estado, setEstado] = useState<Resultado>({});
  const [pendente, iniciar] = useTransition();
  const [etapa, setEtapa] = useState('');
  const [tipo, setTipo] = useState<'aula' | 'lista'>('aula');

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    iniciar(async () => {
      setEstado({});
      try {
        for (const [campo, destino] of [['pdf', 'pdf_path'], ['gabarito_pdf', 'gabarito_pdf_path']] as const) {
          const arq = dados.get(campo);
          if (arq instanceof File && arq.size > 0) {
            setEtapa('Enviando PDF…');
            dados.set(destino, await enviarPdf(`habilidades/${habilidade}`, arq));
          }
          dados.delete(campo);
        }
        setEtapa('Salvando…');
        const r = await salvarMaterial({}, dados);
        setEstado(r);
        if (r.ok) form.reset();
      } catch (err) {
        setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar.' });
      } finally {
        setEtapa('');
      }
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input type="hidden" name="habilidade" value={habilidade} />
      <div className={styles.campos}>
        <div className="campo">
          <label htmlFor="mtipo">Tipo</label>
          <select id="mtipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as 'aula' | 'lista')}>
            <option value="aula">Aula da habilidade</option>
            <option value="lista">Lista de exercícios</option>
          </select>
        </div>
        <div className="campo" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="mtit">Título</label>
          <input id="mtit" name="titulo" type="text" required placeholder={tipo === 'aula' ? `Ex.: ${habilidade} na prática` : `Ex.: Lista 1 · ${habilidade}`} />
        </div>
        <div className="campo"><label htmlFor="mord">Ordem</label><input id="mord" name="ordem" type="number" min={0} defaultValue={0} /></div>
        <div className="campo" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="mvid">{tipo === 'aula' ? 'Vídeo (link do YouTube)' : 'Correção em vídeo (opcional)'}</label>
          <input id="mvid" name="video_url" type="url" placeholder="https://youtu.be/..." />
        </div>
        <div className="campo">
          <label htmlFor="mpdf">{tipo === 'aula' ? 'PDF (opcional)' : 'PDF da lista'}</label>
          <input id="mpdf" name="pdf" type="file" accept="application/pdf" style={{ paddingBlock: 10 }} />
        </div>
        {tipo === 'lista' && (
          <div className="campo">
            <label htmlFor="mgab">PDF do gabarito (opcional)</label>
            <input id="mgab" name="gabarito_pdf" type="file" accept="application/pdf" style={{ paddingBlock: 10 }} />
          </div>
        )}
      </div>
      <label className={styles.check}><input type="checkbox" name="publicada" defaultChecked /> Publicar para os alunos agora</label>
      <div className="linha-flex">
        <button className="btn btn-azul" disabled={pendente}>{pendente ? etapa || 'Salvando…' : 'Adicionar'}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
