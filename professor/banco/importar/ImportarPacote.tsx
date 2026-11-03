'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { enviarArquivoEm } from '@/lib/upload';
import styles from '../../professor.module.css';

// Formato do questoes.json (o "prova" vale para todas as questões; cada questão pode sobrescrever):
// { "prova": { "codigo": "CB-PRF-2021", "banca": "Cebraspe", "orgao": "PRF", "cargo": "Policial Rodoviário Federal",
//              "ano": 2021, "escolaridade": "superior", "tipo": "certo_errado" },
//   "textos_base": [ { "codigo": "CB-PRF-2021-TB1", "texto": "…", "figuras": ["tb1-fig1.webp"] } ],
//   "questoes": [ { "codigo": "CB-PRF-2021-15", "numero_prova": 15, "disciplina": "Direito Constitucional",
//                   "assunto": "…", "texto_base": "CB-PRF-2021-TB1", "enunciado": "…", "resposta": "C",
//                   "alternativas": { "A": "…" }, "comentario": "…", "nivel": "medio", "figuras": [], "imagem": "q15.webp" } ] }
type Prova = { codigo?: string; banca?: string; orgao?: string; cargo?: string; ano?: number; escolaridade?: string; tipo?: string; origem?: string };
type Item = Prova & {
  prova?: string; numero_prova?: number; disciplina?: string; assunto?: string | null; texto_base?: string | null;
  enunciado?: string; alternativas?: Record<string, string>; resposta?: string | null; comentario?: string | null;
  video_url?: string | null; nivel?: string | null; figuras?: string[]; imagem?: string; formato?: 'texto' | 'imagem';
};
type TextoBase = { codigo: string; texto: string; figuras?: string[] };

const CODIGO = /^[A-Z0-9-]{3,40}$/;
const ESC = ['fundamental', 'medio', 'superior'];
const NIV = ['facil', 'medio', 'dificil'];

export function ImportarPacote() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [substituir, setSubstituir] = useState(false);
  const [rodando, setRodando] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0 });
  const anota = (m: string) => setLog((l) => [...l, m]);

  async function importar() {
    setLog([]);
    const json = arquivos.find((f) => f.name.toLowerCase().endsWith('.json'));
    if (!json) return anota('Escolha também o arquivo questoes.json.');
    let itens: Item[]; let prova: Prova = {}; let textos: TextoBase[] = [];
    try {
      const dados = JSON.parse(await json.text());
      itens = Array.isArray(dados) ? dados : dados.questoes;
      prova = (!Array.isArray(dados) && dados.prova) || {};
      textos = (!Array.isArray(dados) && dados.textos_base) || [];
      if (!Array.isArray(itens) || !Array.isArray(textos)) throw new Error();
    } catch {
      return anota('O questoes.json não está no formato esperado.');
    }
    const imagens = new Map(arquivos.filter((f) => f !== json).map((f) => [f.name, f]));
    const pasta = `questoes/${String(prova.codigo ?? 'avulsas').toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
    const supabase = createClient();
    setRodando(true);

    try {
      // questões já revisadas não são sobrescritas (a menos que marcado)
      const codigos = itens.map((q) => String(q.codigo ?? '').toUpperCase()).filter(Boolean);
      const revisadas = new Set<string>();
      for (let i = 0; i < codigos.length; i += 100) {
        const { data } = await supabase.from('questoes').select('codigo, revisada').in('codigo', codigos.slice(i, i + 100));
        ((data ?? []) as { codigo: string; revisada: boolean }[]).forEach((q) => { if (q.revisada) revisadas.add(q.codigo); });
      }

      // 1) textos-base (com as figuras)
      const idTexto = new Map<string, string>();
      for (const t of textos) {
        const codigo = String(t.codigo ?? '').toUpperCase().trim();
        if (!CODIGO.test(codigo)) { anota(`Texto-base ignorado: código inválido (${t.codigo})`); continue; }
        const figs: string[] = [];
        let falta = '';
        for (const n of t.figuras ?? []) { const f = imagens.get(n); if (!f) { falta = n; break; } figs.push(await enviarArquivoEm(`${pasta}/textos/${f.name}`, f)); }
        if (falta) { anota(`Texto-base ${codigo}: faltou a figura ${falta}, não importado.`); continue; }
        const { data, error } = await supabase.from('textos_base').upsert({ codigo, texto: String(t.texto ?? '').slice(0, 20000), figuras: figs }, { onConflict: 'codigo' }).select('id').single();
        if (error || !data) { anota(`Texto-base ${codigo}: ${error?.message ?? 'erro'}`); continue; }
        idTexto.set(codigo, (data as { id: string }).id);
      }
      // textos citados que já estavam no banco
      const citados = Array.from(new Set(itens.map((q) => String(q.texto_base ?? '').toUpperCase()).filter((c) => c && !idTexto.has(c))));
      if (citados.length) {
        const { data } = await supabase.from('textos_base').select('id, codigo').in('codigo', citados);
        ((data ?? []) as { id: string; codigo: string }[]).forEach((t) => idTexto.set(t.codigo, t.id));
      }

      // 2) conferência das questões
      const validos: { linha: Record<string, unknown>; gab: Record<string, unknown>; img?: File; figs: File[]; codigo: string }[] = [];
      const catalogo = new Map<string, Set<string>>();
      for (const item of itens) {
        const q = { ...prova, ...item };
        const codigo = String(q.codigo ?? '').toUpperCase().trim();
        const tipo = q.tipo === 'certo_errado' ? 'certo_errado' : 'multipla';
        const resp = String(q.resposta ?? '').toUpperCase().trim();
        const disciplina = String(q.disciplina ?? '').trim().slice(0, 80);
        if (!CODIGO.test(codigo)) { anota(`Ignorada: código inválido (${item.codigo})`); continue; }
        if (resp === 'X' || resp === 'ANULADA') { anota(`${codigo}: anulada no gabarito oficial, não importada.`); continue; }
        if (tipo === 'certo_errado' ? !/^[CE]$/.test(resp) : !/^[A-E]$/.test(resp)) { anota(`${codigo}: sem gabarito válido (${resp || 'vazio'}), não importada.`); continue; }
        if (!disciplina) { anota(`${codigo}: sem disciplina, não importada.`); continue; }
        if (revisadas.has(codigo) && !substituir) { anota(`${codigo}: já revisada por você, mantida como está.`); continue; }
        const tb = String(item.texto_base ?? '').toUpperCase();
        if (tb && !idTexto.has(tb)) { anota(`${codigo}: o texto-base ${tb} não existe, não importada.`); continue; }
        const img = item.imagem ? imagens.get(item.imagem) : undefined;
        if (item.imagem && !img) { anota(`${codigo}: faltou o arquivo ${item.imagem}, não importada.`); continue; }
        const figs = (item.figuras ?? []).map((n) => imagens.get(n));
        const faltou = (item.figuras ?? []).find((_, i) => !figs[i]);
        if (faltou) { anota(`${codigo}: faltou a figura ${faltou}, não importada.`); continue; }
        const formato = item.formato ?? (item.enunciado || item.alternativas ? 'texto' : img ? 'imagem' : 'texto');
        const alt = (L: string) => (tipo === 'multipla' ? String(item.alternativas?.[L] ?? '') : '');
        const assunto = item.assunto ? String(item.assunto).trim().slice(0, 120) : null;
        if (!catalogo.has(disciplina)) catalogo.set(disciplina, new Set());
        if (assunto) catalogo.get(disciplina)!.add(assunto);
        validos.push({
          codigo, img, figs: figs as File[],
          linha: {
            codigo, origem: q.origem === 'autoral' ? 'autoral' : 'prova', tipo,
            banca: q.banca ?? null, orgao: q.orgao ?? null, cargo: q.cargo ?? null, ano: q.ano ?? null,
            escolaridade: ESC.includes(String(q.escolaridade)) ? q.escolaridade : null,
            prova: (item.prova ?? prova.codigo ?? null) ? String(item.prova ?? prova.codigo).toUpperCase() : null,
            numero_prova: item.numero_prova ?? null, disciplina, assunto, texto_base_id: tb ? idTexto.get(tb) : null,
            enunciado: String(item.enunciado ?? '').slice(0, 8000), formato, imagem_path: null as string | null, figuras: [] as string[],
            alt_a: alt('A'), alt_b: alt('B'), alt_c: alt('C'), alt_d: alt('D'), alt_e: alt('E'),
            nivel: NIV.includes(String(item.nivel)) ? item.nivel : null, publicada: false, revisada: false,
          },
          gab: { resposta: resp, comentario: item.comentario ?? null, video_url: item.video_url ?? null },
        });
      }

      // 3) disciplinas e assuntos novos entram no catálogo
      if (catalogo.size) {
        await supabase.from('disciplinas').upsert(Array.from(catalogo.keys()).map((nome) => ({ nome })), { onConflict: 'nome', ignoreDuplicates: true });
        const pares = Array.from(catalogo.entries()).flatMap(([disciplina, as]) => Array.from(as).map((nome) => ({ disciplina, nome })));
        if (pares.length) await supabase.from('assuntos').upsert(pares, { onConflict: 'disciplina,nome', ignoreDuplicates: true });
      }
      setProgresso({ feito: 0, total: validos.length });

      // 4) recortes e figuras
      let feito = 0;
      for (const v of validos) {
        if (v.img) v.linha.imagem_path = await enviarArquivoEm(`${pasta}/${v.img.name}`, v.img);
        if (v.figs.length) {
          const caminhos: string[] = [];
          for (const f of v.figs) caminhos.push(await enviarArquivoEm(`${pasta}/figuras/${f.name}`, f));
          v.linha.figuras = caminhos;
        }
        setProgresso({ feito: ++feito, total: validos.length });
      }

      // 5) questões e gabaritos, em blocos
      let salvas = 0;
      for (let i = 0; i < validos.length; i += 50) {
        const bloco = validos.slice(i, i + 50);
        const { data, error } = await supabase.from('questoes').upsert(bloco.map((v) => v.linha), { onConflict: 'codigo' }).select('id, codigo');
        if (error) { anota(`Erro ao salvar o bloco ${i / 50 + 1}: ${error.message}`); continue; }
        const ids = new Map(((data ?? []) as { id: string; codigo: string }[]).map((d) => [d.codigo, d.id]));
        const { error: eg } = await supabase.from('questoes_gabarito')
          .upsert(bloco.filter((v) => ids.has(v.codigo)).map((v) => ({ questao_id: ids.get(v.codigo), ...v.gab })));
        if (eg) anota(`Erro ao salvar os gabaritos do bloco ${i / 50 + 1}: ${eg.message}`);
        else salvas += ids.size;
      }
      anota(`Pronto: ${idTexto.size ? `${textos.length} textos-base e ` : ''}${salvas} questões importadas como rascunho. Revise e publique em Banco de questões.`);
      router.refresh();
    } catch (e) {
      anota(e instanceof Error ? e.message : 'Erro na importação.');
    } finally {
      setRodando(false);
    }
  }

  const nJson = arquivos.filter((f) => f.name.toLowerCase().endsWith('.json')).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="campo">
        <label htmlFor="pacote">Arquivos do pacote (selecione todos: o questoes.json e as imagens)</label>
        <input id="pacote" type="file" multiple accept=".json,.webp,.png,.jpg,.jpeg" style={{ paddingBlock: 10 }}
          onChange={(e) => setArquivos(Array.from(e.target.files ?? []))} />
        {arquivos.length > 0 && <span className="suave" style={{ fontSize: 14 }}>{arquivos.length - nJson} imagens e {nJson} arquivo de dados selecionados</span>}
      </div>
      <label className={styles.check}><input type="checkbox" checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} /> Substituir também as questões que eu já revisei</label>
      <div className="linha-flex">
        <button className="btn btn-azul" onClick={importar} disabled={rodando || arquivos.length === 0}>
          {rodando ? `Importando… ${progresso.feito} de ${progresso.total}` : 'Importar'}
        </button>
      </div>
      {log.length > 0 && (
        <div role="log" className="cartao" style={{ padding: 14, maxHeight: 320, overflowY: 'auto', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {log.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}
