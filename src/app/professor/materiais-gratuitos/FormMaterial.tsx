'use client';

import { useState, type ChangeEvent } from 'react';
import { FormAcao } from '../FormAcao';
import { salvarMaterialGratuito } from './acoes';
import { enviarPdfProduto } from '@/lib/upload';

export function FormMaterial() {
  const [caminho, setCaminho] = useState(''); const [nome, setNome] = useState(''); const [msg, setMsg] = useState('');
  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const a = e.target.files?.[0]; if (!a) return;
    setMsg('Enviando…');
    try { setCaminho(await enviarPdfProduto(a)); setNome(a.name); setMsg('PDF enviado.'); }
    catch (err) { setCaminho(''); setMsg(err instanceof Error ? err.message : 'Erro ao enviar.'); }
  }
  return (
    <FormAcao acao={salvarMaterialGratuito} botao="Publicar material">
      <div className="campo"><label htmlFor="mt">Título</label><input id="mt" name="titulo" required maxLength={140} placeholder="Mapa mental de Concordância" /></div>
      <div className="campo"><label htmlFor="md">Descrição curta (opcional)</label><input id="md" name="descricao" maxLength={400} /></div>
      <div className="campo"><label htmlFor="mp">PDF</label><input id="mp" type="file" accept="application/pdf" onChange={aoEscolher} style={{ paddingBlock: 10 }} />{msg && <span role="status" className="suave">{msg}</span>}</div>
      <input type="hidden" name="pdf_path" value={caminho} /><input type="hidden" name="pdf_nome" value={nome} />
      <div className="campo"><label htmlFor="mo">Ordem (menor primeiro)</label><input id="mo" name="ordem" type="number" defaultValue={1} /></div>
      <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" name="publicado" defaultChecked /> Publicar agora</label>
    </FormAcao>
  );
}
