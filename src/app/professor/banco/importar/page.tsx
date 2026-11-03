import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { ImportarPacote } from './ImportarPacote';
import styles from '../../professor.module.css';

export const metadata = { title: 'Importar questões · Painel do professor' };

export default function Importar() {
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Banco de questões', href: '/professor/banco' }, { rotulo: 'Importar pacote' }]} />
      <h1 className={`display ${styles.titulo}`}>Importar pacote de questões</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        Cada pacote é uma prova: as imagens das questões e o arquivo questoes.json com gabarito, classificação e resolução.
        Tudo entra como rascunho, sem aparecer para os alunos. Depois você revisa e publica a prova inteira de uma vez.
        Importar o mesmo pacote de novo atualiza as questões, menos as que você já marcou como revisadas.
      </p>
      <section className={`cartao ${styles.bloco}`}>
        <ImportarPacote />
      </section>
    </>
  );
}
