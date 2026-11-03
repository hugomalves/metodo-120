import Link from 'next/link';
import { Marca, Logo120 } from '@/components/Marca';
import { FormularioEntrar } from './FormularioEntrar';
import styles from './entrar.module.css';

export const metadata = { title: 'Entrar' };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ modo?: string; aviso?: string }> }) {
  const { modo, aviso } = await searchParams;
  return (
    <div className="container">
      <header className="topo">
        <Marca />
        <Link href="/" style={{ fontWeight: 600 }}>Voltar para a vitrine</Link>
      </header>
      <div className={styles.duas}>
        <aside className={`cartao-gradiente ${styles.painel}`}>
          <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(24px, 4vw, 40px) 0' }}><Logo120 tamanho={84} slogan /></div>
          <div className={styles.painelTexto}>
            <p className="display" style={{ margin: 0, fontSize: 'clamp(24px, 2.6vw, 32px)', lineHeight: 1.12 }}>
              Plano de estudo do seu edital, questões da sua banca e simulados no formato da prova.
            </p>
            <div className="linha-flex">
              <img src="/img/expert-rosto.jpg" alt="" width={52} height={52} className={styles.mini} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong>Método 120</strong>
                <span className="suave" style={{ fontSize: 14 }}>Entre para continuar de onde parou.</span>
              </div>
            </div>
          </div>
        </aside>
        <main className={`cartao ${styles.form}`}>
          <FormularioEntrar modoInicial={modo === 'criar' ? 'criar' : 'entrar'} aviso={aviso} />
        </main>
      </div>
    </div>
  );
}
