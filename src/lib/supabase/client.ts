import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabase/env';

// Cliente usado nos componentes que rodam no navegador
export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_KEY,
  );
}
