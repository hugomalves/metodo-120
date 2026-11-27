import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { iaConfigurada } from '@/lib/redacaoIA';
import { AbasProfRedacao } from '../AbasProfRedacao';
import { TesteIA } from './TesteIA';
import styles from '../../professor.module.css';

export const metadata = { title: 'Testar a IA · Painel do professor' };
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default function TestarIA() {
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Redações', href: '/professor/redacoes' }, { rotulo: 'Testar a IA' }]} />
      <h1 className={`display ${styles.titulo}`}>Testar a IA</h1>
      <AbasProfRedacao ativa="testar" />
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>Cole uma redação que você já corrigiu e compare a nota da IA com a sua, nos 4 critérios da AOCP. Nada é salvo e nenhum aluno vê.</p>
      {!iaConfigurada()
        ? <p className="erro" role="alert">A IA está desligada: falta <code>GROQ_API_KEY</code> (ou <code>SUPABASE_SERVICE_ROLE_KEY</code>) na Vercel.</p>
        : <section className={`cartao ${styles.bloco}`}><TesteIA /></section>}
    </>
  );
}
