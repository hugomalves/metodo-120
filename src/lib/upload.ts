import { createClient } from '@/lib/supabase/client';

const limparNome = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase();

async function enviar(pasta: string, arquivo: File, tipo: string): Promise<string> {
  const caminho = `${pasta}/${Date.now()}-${limparNome(arquivo.name)}`;
  const { error } = await createClient()
    .storage.from('materiais')
    .upload(caminho, arquivo, { contentType: tipo, upsert: false });
  if (error) throw new Error('Não foi possível enviar o arquivo: ' + error.message);
  return caminho;
}

// Envia um PDF direto do navegador para o Supabase (sem passar pelo servidor do site,
// que tem limite de tamanho). Devolve o caminho salvo no bucket 'materiais'.
export async function enviarPdf(pasta: string, arquivo: File): Promise<string> {
  if (arquivo.type && arquivo.type !== 'application/pdf') throw new Error('Envie um arquivo em PDF.');
  return enviar(pasta, arquivo, 'application/pdf');
}

// Figura de questão (PNG, JPG ou WebP, até 3 MB)
export async function enviarImagem(pasta: string, arquivo: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) throw new Error('A figura precisa ser PNG, JPG ou WebP.');
  if (arquivo.size > 3 * 1024 * 1024) throw new Error('A figura pode ter até 3 MB.');
  return enviar(pasta, arquivo, arquivo.type);
}

// Envia (ou substitui) um arquivo num caminho fixo do bucket — usado na importação de provas
export async function enviarArquivoEm(caminho: string, arquivo: File): Promise<string> {
  const { error } = await createClient()
    .storage.from('materiais')
    .upload(caminho, arquivo, { contentType: arquivo.type || 'image/webp', upsert: true });
  if (error) throw new Error(`Não foi possível enviar ${arquivo.name}: ${error.message}`);
  return caminho;
}
