'use client';

import { useState, type ChangeEvent } from 'react';
import { FormAcao } from '../FormAcao';
import { salvarImagemNoticia } from './acoes';
import { enviarImagemVitrine } from '@/lib/upload';
import { CARREIRAS } from '@/lib/noticiasConcursos';

export function FormImagem() {
  const [caminho, setCaminho] = useState(''); const [msg, setMsg] = useState('');
  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const a = e.target.files?.[0]; if (!a) return;
    setMsg('Enviando…');
    try { setCaminho(await enviarImagemVitrine(a)); setMsg('Imagem enviada.'); }
    catch (err) { setCaminho(''); setMsg(err instanceof Error ? err.message : 'Erro ao enviar.'); }
  }
  return (
    <FormAcao acao={salvarImagemNoticia} botao="Salvar imagem">
      <div className="campo"><label htmlFor="ir">Nome (só para você)</label><input id="ir" name="rotulo" required maxLength={60} placeholder="PRF" /></div>
      <div className="campo"><label htmlFor="ip">Palavras do título que usam esta imagem (separadas por vírgula)</label><input id="ip" name="palavras" placeholder="PRF, Rodoviária Federal" /></div>
      <div className="campo"><label htmlFor="ic">Ou: imagem padrão de um quadrado (deixe as palavras em branco)</label>
        <select id="ic" name="carreira" defaultValue=""><option value="">Não é padrão de quadrado</option>{CARREIRAS.map((c) => <option key={c.chave} value={c.chave}>{c.nome}</option>)}</select></div>
      <div className="campo"><label htmlFor="ii">Imagem (PNG, JPG ou WebP, até 2 MB; de preferência na horizontal)</label><input id="ii" type="file" accept="image/png,image/jpeg,image/webp" onChange={aoEscolher} style={{ paddingBlock: 10 }} />{msg && <span role="status" className="suave">{msg}</span>}</div>
      <input type="hidden" name="imagem_path" value={caminho} />
    </FormAcao>
  );
}
