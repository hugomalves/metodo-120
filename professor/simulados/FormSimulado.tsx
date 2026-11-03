'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { salvarSimulado, type Resultado } from '../actions';
import { enviarPdf } from '@/lib/upload';
import styles from '../professor.module.css';

const PADRAO: Record<string, number> = { mini: 30, completo: 45, diagnostico: 30 };

export function FormSimulado() {
  const [estado, setEstado] = useState<Resultado>({});
  const [pendente, iniciar] = useTransition();
  const [etapa, setEtapa] = useState('');
  const [n, setN] = useState(30);
  const [gab, setGab] = useState('');

  const limpo = gab.toUpperCase().replace(/\s/g, '');
  const invalidas = Array.from(new Set(limpo.replace(/[A-E]/g, '').split(''))).join(' ');
  let aviso = `${limpo.length} de ${n} letras`;
  let corAviso = 'var(--suave)';
  if (invalidas) { aviso = `Use só A, B, C, D e E. Encontrei: ${invalidas}`; corAviso = 'var(--erro)'; }
  else if (limpo.length < n) aviso += ` · faltam ${n - limpo.length}`;
  else if (limpo.length > n) { aviso += ` · sobram ${limpo.length - n}`; corAviso = 'var(--erro)'; }
  else { aviso += ' · gabarito completo'; corAviso = 'var(--ciano)'; }

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    iniciar(async () => {
      setEstado({});
      try {
        for (const [campo, pasta, destino] of [
          ['prova_pdf', 'simulados', 'prova_pdf_path'],
          ['gabarito_pdf', 'gabaritos', 'gabarito_pdf_path'],
        ] as const) {
          const arq = dados.get(campo);
          if (arq instanceof File && arq.size > 0) {
            setEtapa('Enviando PDFs…');
            dados.set(destino, await enviarPdf(pasta, arq));
          }
          dados.delete(campo);
        }
        setEtapa('Salvando…');
        const r = await salvarSimulado({}, dados);
        setEstado(r);
        if (r.ok) { form.reset(); setGab(''); }
      } catch (err) {
        setEstado({ erro: err instanceof Error ? err.message : 'Erro ao enviar.' });
      } finally {
        setEtapa('');
      }
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className={styles.campos}>
        <div className="campo"><label htmlFor="scod">Código</label><input id="scod" name="codigo" type="text" required placeholder="MS-03-GAB" className="mono" style={{ textTransform: 'uppercase' }} /></div>
        <div className="campo">
          <label htmlFor="stipo">Tipo</label>
          <select id="stipo" name="tipo" defaultValue="mini" onChange={(e) => setN(PADRAO[e.target.value] ?? 30)}>
            <option value="mini">Minissimulado</option>
            <option value="completo">Simulado completo</option>
            <option value="diagnostico">Diagnóstico</option>
          </select>
        </div>
        <div className="campo"><label htmlFor="sn">Nº de questões</label><input id="sn" name="n_questoes" type="number" min={1} max={90} value={n} onChange={(e) => setN(parseInt(e.target.value, 10) || 0)} required /></div>
        <div className="campo">
          <label htmlFor="stri">Trilha</label>
          <select id="stri" name="trilha" defaultValue="ambas">
            <option value="ambas">Ambas</option>
            <option value="gabaritar">Gabaritar</option>
            <option value="ir_bem">Ir bem</option>
          </select>
        </div>
        <div className="campo"><label htmlFor="ssem">Semana</label><input id="ssem" name="semana" type="number" min={0} max={40} placeholder="Ex.: 3" /></div>
        <div className="campo"><label htmlFor="sprova">PDF da prova</label><input id="sprova" name="prova_pdf" type="file" accept="application/pdf" style={{ paddingBlock: 10 }} /></div>
        <div className="campo"><label htmlFor="sgpdf">PDF do gabarito comentado</label><input id="sgpdf" name="gabarito_pdf" type="file" accept="application/pdf" style={{ paddingBlock: 10 }} /></div>
        <div className="campo"><label htmlFor="svid">Vídeo da correção (opcional)</label><input id="svid" name="correcao_video_url" type="url" placeholder="https://youtu.be/..." /></div>
      </div>
      <div className="campo">
        <label htmlFor="sgab">Gabarito (as letras em sequência, da questão 1 em diante)</label>
        <input id="sgab" name="gabarito" type="text" required value={gab} onChange={(e) => setGab(e.target.value.toUpperCase())} placeholder="Ex.: CADBEBCEAD…" className="mono" style={{ fontSize: 17, letterSpacing: '0.18em' }} />
        <span role="status" style={{ fontSize: 14, fontWeight: 600, color: corAviso }}>{aviso}</span>
      </div>
      <div className="campo">
        <label htmlFor="shab">Habilidade de cada questão (opcional, na mesma ordem)</label>
        <input id="shab" name="habilidades" type="text" placeholder="Ex.: H3, H1, H2, … (uma por questão)" />
        <span className="suave" style={{ fontSize: 13 }}>Depois de salvar, use “Classificar” na lista abaixo para pôr assunto, nível e comentário de cada questão.</span>
      </div>
      <label className={styles.check}><input type="checkbox" name="liberado" defaultChecked /> Liberar para os alunos agora</label>
      <div className="linha-flex">
        <button className="btn btn-azul" disabled={pendente}>{pendente ? etapa || 'Salvando…' : 'Salvar simulado'}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
