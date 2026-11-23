'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { unzip } from 'fflate';
import { createClient } from '@/lib/supabase/client';
import { registrarPdfs } from './acoes';

// nome do arquivo → código do PDF no plano (o mesmo do link/QR impresso)
export function codigoDoArquivo(nome: string): string | null {
  const n = nome.split('/').pop() ?? nome;
  let m = n.match(/^([A-Z]{2})-Aula(\d+)-Bloco(\d+)de\d+\.pdf$/i);
  if (m) return `${m[1].toUpperCase()}-AULA${m[2].padStart(2, '0')}-B${Number(m[3])}`;
  m = n.match(/^RD-Proposta(\d+)-Bloco(\d+)de\d+\.pdf$/i);
  if (m) return `RD-PROP${Number(m[1])}-B${Number(m[2])}`;
  m = n.match(/^RD-Proposta(\d+)-completa\.pdf$/i);
  if (m) return `RD-PROP${Number(m[1])}`;
  m = n.match(/^([A-Z]{2})-Aula(\d+)-.*-completa\.pdf$/i);
  if (m) return `${m[1].toUpperCase()}-AULA${m[2].padStart(2, '0')}`;
  return null;
}

type Arq = { codigo: string; nome: string; dados: Blob };

function abrirZip(f: File): Promise<Arq[]> {
  return f.arrayBuffer().then((buf) => new Promise<Arq[]>((ok, falha) => {
    unzip(new Uint8Array(buf), { filter: (x) => /\.pdf$/i.test(x.name) && !!codigoDoArquivo(x.name) }, (erro, saida) => {
      if (erro) { falha(erro); return; }
      ok(Object.entries(saida).map(([nome, bytes]) => ({ codigo: codigoDoArquivo(nome)!, nome: nome.split('/').pop()!, dados: new Blob([bytes as BlobPart], { type: 'application/pdf' }) })));
    });
  }));
}

export function EnviarPdfs() {
  const router = useRouter();
  const [estado, setEstado] = useState<{ total: number; feitos: number; erros: string[]; ignorados: number; fim?: boolean } | null>(null);
  const [lendo, setLendo] = useState(false);

  async function enviar(lista: FileList | null) {
    if (!lista?.length) return;
    setLendo(true);
    const arqs = new Map<string, Arq>();
    let ignorados = 0;
    const erros: string[] = [];
    for (const f of Array.from(lista)) {
      if (/\.zip$/i.test(f.name)) {
        try { (await abrirZip(f)).forEach((a) => arqs.set(a.codigo, a)); } catch { erros.push(`Não consegui abrir ${f.name}`); }
      } else {
        const c = codigoDoArquivo(f.name);
        if (c) arqs.set(c, { codigo: c, nome: f.name, dados: f }); else ignorados++;
      }
    }
    setLendo(false);
    const fila = Array.from(arqs.values());
    setEstado({ total: fila.length, feitos: 0, erros, ignorados });
    const supabase = createClient();
    let feitos = 0;
    let pendentes: { codigo: string; caminho: string; bytes: number; nome: string }[] = [];
    const registrar = async () => {
      if (!pendentes.length) return;
      const lote = pendentes; pendentes = [];
      const r = await registrarPdfs(lote);
      if (r.erro) erros.push(r.erro);
    };
    async function trabalhador() {
      for (;;) {
        const a = fila.shift();
        if (!a) return;
        const caminho = `curso/reta-final-pmpe/${a.codigo}.pdf`;
        const { error } = await supabase.storage.from('produtos-pdf').upload(caminho, a.dados, { contentType: 'application/pdf', upsert: true });
        if (error) erros.push(`${a.nome}: ${error.message}`);
        else pendentes.push({ codigo: a.codigo, caminho, bytes: a.dados.size, nome: a.nome });
        feitos++;
        if (pendentes.length >= 25) await registrar();
        setEstado({ total: arqs.size, feitos, erros: [...erros], ignorados });
      }
    }
    await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);
    await registrar();
    setEstado({ total: arqs.size, feitos, erros: [...erros], ignorados, fim: true });
    router.refresh();
  }

  const pct = estado ? Math.round((100 * estado.feitos) / Math.max(1, estado.total)) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="btn btn-azul" style={{ alignSelf: 'flex-start', cursor: 'pointer' }}>
        Escolher os arquivos .zip (ou os PDFs)
        <input type="file" multiple accept=".zip,.pdf,application/zip,application/pdf" style={{ display: 'none' }}
          disabled={lendo || (!!estado && !estado.fim)} onChange={(e) => { enviar(e.target.files); e.target.value = ''; }} />
      </label>
      <span className="suave" style={{ fontSize: 14 }}>Pode escolher todos os .zip de uma vez (segure Ctrl para marcar vários). O site abre os zips, encontra os PDFs pelo nome e envia.</span>
      {lendo && <p role="status" style={{ margin: 0 }}>Abrindo os arquivos…</p>}
      {estado && (
        <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 10, background: 'var(--trilho)', borderRadius: 5, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--azul)' }} /></div>
          <b>{estado.fim ? `Pronto: ${estado.feitos - estado.erros.length} PDFs enviados.` : `Enviando… ${estado.feitos} de ${estado.total}`}</b>
          {estado.ignorados > 0 && <span className="suave" style={{ fontSize: 14 }}>{estado.ignorados} arquivo(s) ignorado(s): o nome não é de aula ou bloco.</span>}
          {estado.erros.length > 0 && <ul className="erro" style={{ margin: 0 }}>{estado.erros.slice(0, 10).map((e) => <li key={e}>{e}</li>)}</ul>}
          {!estado.fim && <span className="suave" style={{ fontSize: 14 }}>Não feche esta página até terminar.</span>}
        </div>
      )}
    </div>
  );
}
