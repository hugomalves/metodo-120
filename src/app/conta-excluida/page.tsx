import Link from 'next/link';
import { PaginaTexto } from '@/components/PaginaTexto';

export const metadata = { title: 'Conta excluída' };

export default function ContaExcluida() {
  return (
    <PaginaTexto titulo="Sua conta foi excluída">
      <p style={{ margin: 0 }}>
        Apagamos o seu cadastro, o seu progresso, as suas dúvidas e o vínculo com o responsável. As respostas dos simulados
        ficam apenas como estatística anônima das questões, sem nenhuma ligação com você.
      </p>
      <p className="suave" style={{ margin: 0 }}>
        Guardamos somente o número do pedido de compra (quando houver), pelo prazo exigido em lei. Para qualquer dúvida, fale com a equipe do curso.
      </p>
      <Link href="/" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>Voltar para a vitrine</Link>
    </PaginaTexto>
  );
}
