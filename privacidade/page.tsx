import { PaginaTexto } from '@/components/PaginaTexto';
import { PRIVACIDADE_HTML } from '@/lib/textosLegais';

export const metadata = { title: 'Política de privacidade' };

// texto em conteudo-legal/privacidade.md (gerado por conteudo-legal/gerar.py)
export default function Privacidade() {
  return (
    <PaginaTexto titulo="Política de privacidade">
      <div className="texto-legal" dangerouslySetInnerHTML={{ __html: PRIVACIDADE_HTML }} />
    </PaginaTexto>
  );
}
