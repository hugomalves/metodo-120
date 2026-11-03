import { PaginaTexto } from '@/components/PaginaTexto';
import { TERMOS_HTML } from '@/lib/textosLegais';

export const metadata = { title: 'Termos de uso' };

// texto em conteudo-legal/termos.md (gerado por conteudo-legal/gerar.py)
export default function Termos() {
  return (
    <PaginaTexto titulo="Termos de uso">
      <div className="texto-legal" dangerouslySetInnerHTML={{ __html: TERMOS_HTML }} />
    </PaginaTexto>
  );
}
