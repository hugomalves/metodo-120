import { Cabecalho } from '@/components/Cabecalho';
import { FormularioEntrar } from './FormularioEntrar';
import styles from './entrar.module.css';

export const metadata = { title: 'Entrar ou cadastrar' };

// Entre e Cadastre-se lado a lado (no celular, um embaixo do outro; quem veio para se cadastrar vê o cadastro primeiro)
export default async function Entrar({ searchParams }: { searchParams: Promise<{ modo?: string; aviso?: string }> }) {
  const { modo, aviso } = await searchParams;
  const criarPrimeiro = modo === 'criar';
  return (
    <>
      <Cabecalho />
      <div className="container">
        <div className={styles.lado} data-criar-primeiro={criarPrimeiro ? 'sim' : undefined}>
          <section className={`cartao ${styles.caixa}`} aria-labelledby="t-entre">
            <h1 id="t-entre" className={styles.caixaTitulo}>Entre</h1>
            <p className="suave" style={{ margin: 0, textAlign: 'center' }}>Já tem conta? Continue de onde parou.</p>
            <FormularioEntrar modoInicial="entrar" aviso={aviso} fixo />
          </section>
          <section className={`cartao ${styles.caixa}`} aria-labelledby="t-cad">
            <h2 id="t-cad" className={styles.caixaTitulo}>Cadastre-se</h2>
            <p className="suave" style={{ margin: 0, textAlign: 'center' }}>Grátis: questões todos os dias, com gabarito e resolução.</p>
            <FormularioEntrar modoInicial="criar" fixo />
          </section>
        </div>
      </div>
    </>
  );
}
