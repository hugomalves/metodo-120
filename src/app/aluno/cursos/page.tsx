import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarLoja } from '@/lib/loja';
import { CartaoProduto } from '@/components/CartaoProduto';
import s from '../aluno.module.css';

export const metadata = { title: 'Cursos em PDF' };

// Todos os cursos à venda; o que o aluno comprou abre, o resto leva direto para a compra
export default async function Cursos() {
  const { supabase, perfil } = await acessoAtual();
  const { produtos, meus } = await carregarLoja(supabase, perfil.id);
  const cursos = produtos.filter((p) => p.tipo === 'curso').sort((a, b) => Number(meus.has(b.id)) - Number(meus.has(a.id)) || Number(b.destaque) - Number(a.destaque) || a.ordem - b.ordem);
  const { data: pdfsRaw } = await supabase.rpc('meus_pdfs');
  const pdfs = (pdfsRaw ?? []) as { produto_id: string; nome: string }[];
  const outros = produtos.filter((p) => p.tipo === 'banco' || p.tipo === 'simulados');

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Cursos em PDF' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Cursos em PDF</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Cada aula é um PDF de teoria com questões, um minissimulado com cartão-resposta e o gabarito comentado. O curso que você comprou fica liberado aqui.
        </p>
      </div>
      {pdfs.length > 0 && (
        <section className={s.grupo} aria-labelledby="meus-pdfs">
          <h2 id="meus-pdfs" className="display">Meus PDFs</h2>
          <div className="linha-flex" style={{ flexWrap: 'wrap' }}>
            {pdfs.map((p) => <Link key={p.produto_id} href={`/aluno/material/${p.produto_id}`} className="btn btn-azul">Abrir PDF · {p.nome}</Link>)}
          </div>
        </section>
      )}
      {cursos.length === 0 ? <p className="suave">Os cursos serão publicados em breve.</p> : (
        <div className="loja-grade">{cursos.map((p) => <CartaoProduto key={p.id} p={p} meu={meus.has(p.id)} acessar="/aluno/trilha" />)}</div>
      )}
      {outros.length > 0 && (
        <section className={s.grupo} aria-labelledby="outros">
          <h2 id="outros" className="display">Para treinar mais</h2>
          <div className="loja-grade">{outros.map((p) => <CartaoProduto key={p.id} p={p} meu={meus.has(p.id)} acessar={p.tipo === 'simulados' ? '/aluno/simulados' : '/aluno/questoes'} />)}</div>
        </section>
      )}
    </>
  );
}
