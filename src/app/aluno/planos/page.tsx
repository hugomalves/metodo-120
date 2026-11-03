import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import s from '../aluno.module.css';

export const metadata = { title: 'Planos' };

type Produto = { slug: string; nome: string; tipo?: string; venda_aberta: boolean; checkout_url: string | null };

export default async function Planos() {
  const { supabase, acesso } = await acessoAtual();
  const { data } = await supabase.from('produtos').select('*');
  const produtos = (data ?? []) as Produto[];
  const banco = produtos.find((p) => p.tipo === 'banco' && p.venda_aberta && p.checkout_url);

  const plano = (titulo: string, itens: string[], rodape: React.ReactNode, destaque = false) => (
    <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, borderColor: destaque ? 'var(--azul)' : undefined, borderWidth: destaque ? 2 : undefined }}>
      <h2 className="display" style={{ margin: 0, fontSize: 21 }}>{titulo}</h2>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--texto-2)' }}>
        {itens.map((i) => <li key={i}>{i}</li>)}
      </ul>
      <div style={{ marginTop: 'auto' }}>{rodape}</div>
    </section>
  );

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Planos' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Planos</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>Questões das 4 áreas do ENEM, com gabarito e resolução comentada.</p>
      </div>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'stretch' }}>
        {plano('Grátis', [
          `${acesso.limiteDia || 10} questões por dia, com gabarito e resolução`,
          `Listas sob medida de até ${acesso.completo ? 10 : acesso.listaMax} questões`,
          'Histórico do que você já fez',
        ], !acesso.completo ? <span className="cc-info">Seu plano atual</span> : null)}
        {plano('Banco completo', [
          'Questões sem limite por dia',
          'Listas sob medida de até 45 questões',
          'Listas para imprimir no padrão do curso',
          'Todas as áreas: Linguagens, Humanas, Natureza e Matemática',
        ], acesso.completo
          ? <span className="cc-info">Você já tem o banco completo.</span>
          : banco ? <a href={banco.checkout_url!} className="btn btn-azul" target="_blank" rel="noopener">Desbloquear o banco completo</a>
            : <span className="cc-info">Em breve.</span>, true)}
        {plano('Curso Método 120', [
          'Matemática do ENEM em 15 minutos por dia',
          'Aulas, minissimulados e simulados completos',
          'Plantão de dúvidas com o professor',
          'Banco completo incluído',
        ], acesso.curso ? <span className="cc-info">Você já é aluno do curso.</span> : <Link href="/" className="btn btn-linha">Conhecer o curso</Link>)}
      </div>
    </>
  );
}
