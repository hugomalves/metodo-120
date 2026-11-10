import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarLoja, quadrosSimulados } from '@/lib/loja';
import { QuadrosSimulados } from '@/components/QuadrosSimulados';
import s from '../aluno.module.css';

export const metadata = { title: 'Simulados' };

// Simulados gerais em quadrados: o gratuito abre; os outros ficam com cadeado e levam para a compra
export default async function Simulados() {
  const { supabase, perfil } = await acessoAtual();
  const loja = await carregarLoja(supabase, perfil.id);
  const itens = await quadrosSimulados(supabase, perfil.id, loja.produtos);

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Simulados' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Simulados</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Provas completas no padrão da banca: você baixa o PDF, resolve no tempo da prova, marca o cartão-resposta aqui e recebe o resultado com o gabarito comentado.
        </p>
      </div>
      {itens.length === 0 ? <p className="suave">Os simulados serão publicados em breve.</p> : <QuadrosSimulados itens={itens} />}
      <section className="cartao" style={{ padding: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <span><b>Treino rápido:</b> monte um simulado com questões do banco, na distribuição do seu edital.</span>
        <Link href="/aluno/provas" className="btn btn-linha">Montar com o banco</Link>
      </section>
    </>
  );
}
