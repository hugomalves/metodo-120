// Endereço e chave pública do Supabase, já limpos: tira espaços, quebras de linha,
// barra no final e o "/rest/v1" que às vezes vem colado ao copiar do painel do Supabase.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
