import type { SupabaseClient } from '@supabase/supabase-js';

// As 4 carreiras da aba Notícias. `consultas` são as buscas feitas de 2 em 2 dias.
export type Carreira = 'federais' | 'civis' | 'militares' | 'guardas';
export const CARREIRAS: { chave: Carreira; nome: string; curto: string; descricao: string; consultas: string[] }[] = [
  { chave: 'federais', nome: 'Polícias Federais', curto: 'Federais', descricao: 'Polícia Federal, Polícia Rodoviária Federal e Polícia Penal Federal.',
    consultas: ['concurso "Polícia Federal"', 'concurso PRF "Polícia Rodoviária Federal"', 'concurso "Polícia Penal Federal"'] },
  { chave: 'civis', nome: 'Polícias Civis e Penais', curto: 'Civis e Penais', descricao: 'Polícias Civis e Polícias Penais dos estados.',
    consultas: ['concurso "Polícia Civil" edital', 'concurso "Polícia Penal" edital', 'concurso "agente penitenciário" edital'] },
  { chave: 'militares', nome: 'Polícia Militar', curto: 'Militar', descricao: 'Concursos das Polícias Militares dos estados.',
    consultas: ['concurso "Polícia Militar" soldado edital', 'concurso "Polícia Militar" oficiais edital'] },
  { chave: 'guardas', nome: 'Guardas Municipais', curto: 'Guardas', descricao: 'Guardas Civis Municipais de todo o país.',
    consultas: ['concurso "Guarda Municipal" edital', 'concurso "Guarda Civil Municipal" edital'] },
];
export const carreiraDe = (c: string) => CARREIRAS.find((x) => x.chave === c);

export type NoticiaConcurso = { id: string; carreira: Carreira; titulo: string; fonte: string | null; url: string; resumo: string | null; texto?: string | null; imagem_path?: string | null; publicada_em: string; oculta: boolean; origem: string };

// ---------- busca (RSS do Google Notícias) ----------
const ENTIDADES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' };
const limpa = (t: string) => t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTIDADES[m] ?? m).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const tag = (item: string, nome: string) => { const m = item.match(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`, 'i')); return m ? limpa(m[1]) : ''; };
const RELEVANTE = /concurso|edital|inscri|sele[cç][aã]o|prova|nomea|vagas|banca|gabarito|cronograma|convoca|autoriza/i;
const chaveTitulo = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 55);

type Item = { titulo: string; fonte: string; url: string; data: Date };

async function buscaRss(consulta: string): Promise<Item[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${consulta} when:10d`)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Metodo120Bot/1.0)' }, cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`RSS ${r.status}`);
  const xml = await r.text();
  const itens: Item[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const bruto = tag(m[1], 'title');
    const fonte = tag(m[1], 'source');
    const link = tag(m[1], 'link');
    const data = new Date(tag(m[1], 'pubDate'));
    if (!bruto || !/^https?:\/\//.test(link) || isNaN(data.getTime())) continue;
    const titulo = fonte && bruto.endsWith(` - ${fonte}`) ? bruto.slice(0, -(fonte.length + 3)) : bruto;
    if (titulo.length < 15 || !RELEVANTE.test(titulo)) continue;
    itens.push({ titulo: titulo.slice(0, 290), fonte: fonte.slice(0, 110), url: link, data });
  }
  return itens;
}

// Cada notícia vai para a carreira que o PRÓPRIO TÍTULO cita (a busca sozinha mistura as carreiras). Sem citar nenhuma, não entra.
const SIGLA_UF = '(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)';
const REGRAS: { chave: Carreira; re: RegExp }[] = [
  { chave: 'federais', re: /pol[ií]cia federal|rodovi[aá]ria federal|penal federal|\b(?:PF|PRF|PPF|DEPEN)\b/i },
  { chave: 'guardas', re: /guarda (?:municipal|civil|metropolitana)|\b(?:GCM|GM)\b/i },
  { chave: 'militares', re: new RegExp(`pol[ií]cia militar|\\bPM[ -]?${SIGLA_UF}\\b|\\bPM\\b|\\bsoldado`, 'i') },
  { chave: 'civis', re: new RegExp(`pol[ií]cia civil|pol[ií]cia penal|penitenci[aá]ri|\\bPC[ -]?${SIGLA_UF}\\b|\\bPP[ -]?${SIGLA_UF}\\b|delegado|perito|\\bagente de pol`, 'i') },
];
export const classificar = (titulo: string): Carreira | null => REGRAS.find((r) => r.re.test(titulo))?.chave ?? null;

// Busca as notícias de todas as carreiras e guarda as novas. Devolve quantas entraram em cada carreira.
export async function atualizarNoticias(admin: SupabaseClient): Promise<{ novas: Record<string, number>; erros: string[] }> {
  const novas: Record<string, number> = {}; const erros: string[] = [];
  const achadas = new Map<string, Item>();
  for (const c of CARREIRAS) for (const q of c.consultas) {
    await new Promise((r) => setTimeout(r, 700));
    try { for (const it of await buscaRss(q)) { const k = chaveTitulo(it.titulo); const o = achadas.get(k); if (!o || it.data > o.data) achadas.set(k, it); } }
    catch (e) { erros.push(`${c.chave}: ${(e as Error).message}`); }
  }
  const porCarreira = new Map<Carreira, Item[]>();
  for (const it of Array.from(achadas.values()).sort((a, b) => +b.data - +a.data)) {
    const c = classificar(it.titulo); if (!c) continue;
    porCarreira.set(c, [...(porCarreira.get(c) ?? []), it]);
  }
  for (const c of CARREIRAS) {
    const linhas = (porCarreira.get(c.chave) ?? []).slice(0, 25)
      .map((i) => ({ carreira: c.chave, titulo: i.titulo, fonte: i.fonte || null, url: i.url, publicada_em: i.data.toISOString(), origem: 'busca' }));
    if (!linhas.length) { novas[c.chave] = 0; continue; }
    const { data, error } = await admin.from('noticias_concursos').upsert(linhas, { onConflict: 'url', ignoreDuplicates: true }).select('id');
    if (error) erros.push(`${c.chave}: ${error.message}`); else novas[c.chave] = data?.length ?? 0;
  }
  // limpeza: o que veio da busca e tem mais de 45 dias sai da lista
  await admin.from('noticias_concursos').delete().eq('origem', 'busca').lt('publicada_em', new Date(Date.now() - 45 * 864e5).toISOString());
  const res = await resumirPendentes(admin);
  if (res.aviso) erros.push(res.aviso);
  return { novas, erros };
}

// ---------- imagem de cada notícia ----------
export type ImagemAssunto = { palavras: string[]; carreira: string | null; imagem_path: string };
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// 1) imagem própria da notícia; 2) a do assunto cuja palavra (a mais longa) aparece no título; 3) a padrão do quadrado
export function imagemDaNoticia(n: { titulo: string; carreira: string; imagem_path?: string | null }, imagens: ImagemAssunto[]): string | null {
  if (n.imagem_path) return n.imagem_path;
  const t = ` ${semAcento(n.titulo).replace(/[^a-z0-9]+/g, ' ')} `;
  let melhor: { tam: number; caminho: string } | null = null;
  for (const im of imagens) for (const p of im.palavras) {
    const k = semAcento(p).replace(/[^a-z0-9]+/g, ' ').trim();
    if (k && t.includes(` ${k} `) && (!melhor || k.length > melhor.tam)) melhor = { tam: k.length, caminho: im.imagem_path };
  }
  if (melhor) return melhor.caminho;
  const padraoPainel = imagens.find((i) => !i.palavras.length && i.carreira === n.carreira)?.imagem_path;
  if (padraoPainel) return padraoPainel;
  // imagens que já vêm com o site (o painel, quando tiver imagem para o assunto, vence estas)
  for (const d of IMAGENS_DO_SITE) if (d.palavras.some((p) => t.includes(` ${p} `))) return d.src;
  if (n.carreira === 'federais') return '/img/noticias/pf.jpg';
  if (n.carreira === 'militares') return '/img/noticias/pm.jpg';
  if (n.carreira === 'civis') return '/img/noticias/pc.jpg';
  if (n.carreira === 'guardas') return '/img/noticias/gm.jpg';
  return `/img/noticias/${n.carreira}.svg`;
}

const IMAGENS_DO_SITE = [
  { palavras: ['policia penal federal', 'penal federal', 'ppf', 'depen'], src: '/img/noticias/penal-federal.jpg' },
  { palavras: ['policia penal', 'agente penitenciario', 'agentes penitenciarios', 'penitenciario', 'penitenciaria'], src: '/img/noticias/pp.jpg' },
  { palavras: ['pm pe', 'pmpe', 'policia militar de pernambuco', 'militar de pernambuco'], src: '/img/noticias/pm-pe.jpg' },
  { palavras: ['prf', 'rodoviaria federal'], src: '/img/noticias/prf.jpg' },
  { palavras: ['policia federal', 'pf', 'delegado federal', 'agente federal'], src: '/img/noticias/pf.jpg' },
];

// ---------- resumo escrito por IA (só roda se existir ANTHROPIC_API_KEY na Vercel) ----------
async function resumirUma(titulo: string, fonte: string | null, chave: string): Promise<{ resumo: string; texto: string } | null> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-5-5', max_tokens: 500,
      messages: [{ role: 'user', content:
        `Você escreve para o site Método 120, de preparação para concursos de polícia e guarda.\n` +
        `Notícia (só temos o título): "${titulo}"${fonte ? ` — fonte: ${fonte}` : ''}.\n\n` +
        `Responda SOMENTE com JSON: {"resumo": "...", "texto": "..."}.\n` +
        `- "resumo": 1 ou 2 frases curtas (até 170 caracteres) dizendo o que a notícia informa.\n` +
        `- "texto": 3 a 4 frases com palavras suas: o que a notícia informa e o que isso significa para quem estuda (começar a estudar já, acompanhar o edital etc.).\n` +
        `REGRAS: use apenas o que o título diz; NÃO invente números, datas, bancas, salários nem fatos que não estejam no título; não copie o título; não use aspas nem emojis; português do Brasil, tom direto.` }],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`IA ${r.status}`);
  const j = (await r.json()) as { content?: { text?: string }[] };
  const bruto = j.content?.[0]?.text ?? '';
  const m = bruto.match(/\{[\s\S]*\}/);
  if (!m) return null;
  const o = JSON.parse(m[0]) as { resumo?: string; texto?: string };
  if (!o.resumo || !o.texto) return null;
  return { resumo: o.resumo.trim().slice(0, 220), texto: o.texto.trim().slice(0, 900) };
}

// Escreve o resumo das notícias que ainda não têm (até 20 por rodada). Sem chave, não faz nada.
export async function resumirPendentes(admin: SupabaseClient): Promise<{ feitos: number; aviso?: string }> {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) return { feitos: 0, aviso: 'Resumos por IA desligados (falta ANTHROPIC_API_KEY na Vercel): escreva à mão no painel.' };
  const { data } = await admin.from('noticias_concursos').select('id, titulo, fonte').is('resumo', null).eq('origem', 'busca').eq('oculta', false).order('publicada_em', { ascending: false }).limit(20);
  let feitos = 0; let aviso: string | undefined;
  const fila = [...((data ?? []) as { id: string; titulo: string; fonte: string | null }[])];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let n = fila.shift(); n; n = fila.shift()) {
      try {
        const r = await resumirUma(n.titulo, n.fonte, chave);
        if (r) { await admin.from('noticias_concursos').update(r).eq('id', n.id); feitos++; }
      } catch (e) { aviso = (e as Error).message; }
    }
  }));
  return { feitos, aviso: aviso ? `Falha ao resumir algumas: ${aviso}` : undefined };
}
