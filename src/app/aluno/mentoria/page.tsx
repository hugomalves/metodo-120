import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarLoja } from '@/lib/loja';
import { EXPERT } from '@/lib/marca';
import s from '../aluno.module.css';

export const metadata = { title: 'Mentoria individual' };

const PADRAO = ['Plano de estudo ajustado à sua rotina e à sua escala de trabalho', 'Acompanhamento semanal do seu desempenho nos simulados', 'Correção de rota: o que estudar mais e o que deixar para depois', 'Contato direto para tirar dúvidas de estratégia'];

// Painel da mentoria: mostra o que tem; quem não é mentorado vai direto para a compra ao clicar
export default async function Mentoria() {
  const { supabase, perfil } = await acessoAtual();
  const { produtos, meus } = await carregarLoja(supabase, perfil.id);
  const m = produtos.find((p) => p.tipo === 'mentoria');
  const sou = !!m && meus.has(m.id);
  const compra = m?.checkout_url ?? null;
  const itens = m?.beneficios.length ? m.beneficios : PADRAO;
  const whats = process.env.NEXT_PUBLIC_WHATSAPP_URL;

  const botao = (texto: string) => sou
    ? (whats ? <a href={whats} target="_blank" rel="noopener" className="btn btn-azul">Falar com a mentoria</a> : <span className="suave">O contato da mentoria chega no seu e-mail.</span>)
    : compra ? <a href={compra} target="_blank" rel="noopener" className="btn btn-vermelho">{texto}</a>
    : <span className="suave">As vagas da mentoria abrem em breve.</span>;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Mentoria individual' }]} />
      <section className="cartao-gradiente" style={{ padding: 'clamp(22px, 4vw, 36px)', borderRadius: 4, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        <img src={EXPERT.fotoRosto} alt={EXPERT.nome} width={120} height={120} style={{ borderRadius: '50%', border: '3px solid #fff', objectFit: 'cover' }} />
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="rotulo" style={{ color: '#CFE0FF' }}>Mentoria individual</span>
          <h1 className="display" style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 36px)' }}>{m?.nome ?? `Mentoria com ${EXPERT.nome}`}</h1>
          <p style={{ margin: 0, color: '#DCE7FA' }}>{m?.descricao ?? 'Acompanhamento individual para você cumprir o plano até o dia da prova.'}</p>
          <div className="linha-flex">{m?.preco && !sou && <b style={{ fontSize: 26, fontFamily: 'var(--font-display)' }}>{m.preco}</b>}{botao('Quero a mentoria')}</div>
        </div>
      </section>
      <section className={s.grupo} aria-labelledby="inclui">
        <h2 id="inclui" className="display">{sou ? 'Sua mentoria' : 'O que está incluído'}</h2>
        <div className="quadros">
          {itens.map((t, i) => {
            const conteudo = <><span className="quadro-selo">{sou ? 'Liberado' : 'Mentoria'}</span><b style={{ fontSize: 18 }}>{t}</b><span className="quadro-num" aria-hidden="true">{i + 1}</span></>;
            return sou || !compra
              ? <div key={t} className="quadro">{conteudo}</div>
              : <a key={t} href={compra} target="_blank" rel="noopener" className="quadro" data-bloqueado="sim">{conteudo}<span className="quadro-cadeado" aria-hidden="true">🔒</span></a>;
          })}
        </div>
      </section>
    </>
  );
}
