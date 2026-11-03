'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { salvarAula, type Resultado } from '../actions';
import { enviarPdf } from '@/lib/upload';
import styles from '../professor.module.css';

export function FormAula({ modulos }: { modulos: { id: string; rotulo: string }[] }) {
  const [estado, setEstado] = useState<Resultado>({});
  const [pendente, iniciar] = useTransition();
  const [etapa, setEtapa] = useState('');

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    iniciar(async () => {
      setEstado({});
      try {
        const pdf = dados.get('pdf');
        if (pdf instanceof File && pdf.size > 0) {
          setEtapa('Enviando o PDF…');
          dados.set('pdf_path', await enviarPdf('aulas', pdf));
        }
        dados.delete('pdf');
        setEtapa('Salvando…');
        const r = await salvarAula({}, dados);
        setEstado(r);
        if (r.ok) form.reset();
      } catch (err) {
        setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar.' });
      } finally {
        setEtapa('');
      }
    });
  }

  if (!modulos.length) {
    return <p className="suave" style={{ margin: 0 }}>Crie um módulo primeiro, no fim desta página.</p>;
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className={styles.campos}>
        <div className="campo">
          <label htmlFor="amod">Módulo</label>
          <select id="amod" name="modulo_id" required defaultValue={modulos.at(-1)?.id}>
            {modulos.map((m) => <option key={m.id} value={m.id}>{m.rotulo}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="anum">Aula</label>
          <input id="anum" name="numero" type="number" min={1} max={99} required defaultValue={1} />
        </div>
        <div className="campo" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="atit">Título</label>
          <input id="atit" name="titulo" type="text" required placeholder="Ex.: Concordância verbal" />
        </div>
        <div className="campo">
          <label htmlFor="avid">Link do vídeo (YouTube)</label>
          <input id="avid" name="video_url" type="url" placeholder="https://youtu.be/..." />
        </div>
        <div className="campo">
          <label htmlFor="apdf">PDF da aula</label>
          <input id="apdf" name="pdf" type="file" accept="application/pdf" style={{ paddingBlock: 10 }} />
        </div>
        <div className="campo">
          <label htmlFor="atipo">Tipo</label>
          <select id="atipo" name="tipo" defaultValue="aula">
            <option value="aula">Aula</option>
            <option value="revisao">Revisão</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="adur">Duração (minutos)</label>
          <input id="adur" name="duracao_min" type="number" min={5} max={240} defaultValue={30} />
        </div>
      </div>
      <label className={styles.check}><input type="checkbox" name="publicada" defaultChecked /> Publicar agora</label>
      <div className="linha-flex">
        <button className="btn btn-azul" disabled={pendente}>{pendente ? etapa || 'Salvando…' : 'Salvar aula'}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
