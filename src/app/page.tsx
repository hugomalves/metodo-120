import Link from 'next/link';
import { diasAte } from '@/lib/datas';
import { Marca, Logo120 } from '@/components/Marca';
import { CarrosselVitrine, type SlideNoticia } from '@/components/CarrosselVitrine';
import { createClient } from '@/lib/supabase/server';
import { CartaoCapa } from '@/components/CartaoCapa';
import { iconePorDisciplina } from '@/components/Capa';
import { EMPRESA, EXPERT, MARCA } from '@/lib/marca';
import styles from './vitrine.module.css';

export const dynamic = 'force-dynamic';

type Produto = { slug: string; nome: string; tipo: string; venda_aberta: boolean; checkout_url: string | null };
type Edital = { id: string; nome: string; banca: string | null; situacao: string; data_prova: string | null; edital_disciplinas: { disciplina: string; questoes: number; ordem: number }[] };

async function carregar(): Promise<{ produtos: Produto[]; editais: Edital[]; noticias: SlideNoticia[] }> {
  try {
    const supabase = await createClient();
    const [{ data: p }, { data: e }, { data: n }] = await Promise.all([
      supabase.from('produtos').select('slug, nome, tipo, venda_aberta, checkout_url'),
      supabase.from('editais').select('id, nome, banca, situacao, data_prova, edital_disciplinas(disciplina, questoes, ordem)').eq('publicado', true).order('data_prova', { nullsFirst: false }),
      supabase.from('noticias').select('id, rotulo, titulo, resumo, link, botao, imagem_path').eq('publicada', true).order('ordem').order('publicada_em', { ascending: false }).limit(8),
    ]);
    const noticias = ((n ?? []) as (Omit<SlideNoticia, 'imagem'> & { imagem_path: string | null })[]).map(({ imagem_path, ...x }) => ({
      ...x, imagem: imagem_path ? supabase.storage.from('vitrine').getPublicUrl(imagem_path).data.publicUrl : null,
    }));
    return { produtos: (p ?? []) as Produto[], editais: (e ?? []) as Edital[], noticias };
  } catch {
    return { produtos: [], editais: [], noticias: [] };
  }
}

const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default async function Vitrine() {
  const { produtos, editais, noticias } = await carregar();
  const banco = produtos.find((p) => p.tipo === 'banco' && p.venda_aberta && p.checkout_url);
  const cursoAberto = produtos.find((p) => p.tipo === 'curso' && p.venda_aberta && p.checkout_url);
  const abertos = editais.filter((e) => e.situacao === 'aberto');
  const foto = EXPERT.fotoCorpo ?? EXPERT.fotoRosto;

  return (
    <>
      <div className={styles.faixaTopo}>
        <div className="container">
          <header className="topo">
            <Marca tamanho={30} />
            <nav aria-label="Conta" className={`linha-flex ${styles.nav}`} style={{ gap: 10 }}>
              <a href="#banco" className={`btn btn-linha ${styles.navExtra}`}>Questões grátis</a>
              <Link href="/entrar" className="btn btn-linha">Entrar</Link>
              <Link href="/entrar?modo=criar" className="btn btn-azul">Criar conta</Link>
            </nav>
          </header>
        </div>
      </div>

      <div className="container">
        <main className={styles.pagina}>
          <CarrosselVitrine noticias={noticias} fotoExpert={foto} nomeExpert={EXPERT.nome}
            ctaHref={cursoAberto?.checkout_url ?? '/entrar?modo=criar'} ctaTexto={cursoAberto ? 'Quero começar' : 'Criar conta grátis'} />

          <section className={styles.passos} aria-label="Como funciona">
            {[
              ['Estude certo', 'O plano do dia já vem pronto: o que estudar, quantas questões e o que revisar, de acordo com o peso de cada disciplina no edital.'],
              ['Evolua', 'Questões da sua banca com resolução comentada e simulados no formato da prova. Você vê onde está errando e o que fazer a seguir.'],
              ['Aprove', 'Chegue à prova com o edital revisado e treinado no estilo da sua banca, como AOCP e IDIB, com simulados que seguem a regra de corte do edital.'],
            ].map(([t, d], i) => (
              <div key={t} className={styles.passo}>
                <b className={styles.passoNum}>{i + 1}</b>
                <h2 className="display">{t}</h2>
                <p>{d}</p>
              </div>
            ))}
          </section>

          <section id="editais" aria-labelledby="ed-titulo" className={styles.secao}>
            <div className={styles.secaoCabeca}>
              <span className="rotulo">Editais</span>
              <h2 id="ed-titulo" className="display">{abertos.length ? 'Editais abertos agora' : 'Editais'}</h2>
            </div>
            {editais.length === 0 ? (
              <p className="suave" style={{ margin: 0 }}>Os editais acompanhados aparecem aqui.</p>
            ) : (
              <div className={styles.editais}>
                {editais.map((e) => {
                  const dias = e.data_prova ? diasAte(e.data_prova) : null;
                  const discs = [...e.edital_disciplinas].sort((a, b) => a.ordem - b.ordem);
                  return (
                    <article key={e.id} className={`cartao ${styles.edital}`}>
                      <div className="linha-flex" style={{ justifyContent: 'space-between', gap: 8 }}>
                        <span className={styles.selo} data-situacao={e.situacao}>{e.situacao === 'aberto' ? 'Edital aberto' : e.situacao === 'previsto' ? 'Previsto' : 'Encerrado'}</span>
                        {dias !== null && dias > 0 && <span className={styles.contagem}><b>{dias}</b> dias para a prova</span>}
                      </div>
                      <h3 className="display">{e.nome}</h3>
                      <span className="suave">{[e.banca, e.data_prova ? `prova em ${dataBr(e.data_prova)}` : null].filter(Boolean).join(' · ')}</span>
                      <ul className={styles.discs}>
                        {discs.map((d) => <li key={d.disciplina}><span>{d.disciplina}</span><b>{d.questoes}</b></li>)}
                      </ul>
                      <Link href="/entrar?modo=criar" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>Treinar para este edital</Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="banco" aria-labelledby="banco-titulo" className={styles.secao}>
            <div className={styles.secaoCabeca}>
              <span className="rotulo">Banco de questões</span>
              <h2 id="banco-titulo" className="display">Questões de provas reais, por banca, com resolução comentada</h2>
              <p className={styles.lead}>Filtre por edital, disciplina, assunto, banca e ano. Questões de A a E das bancas que mais aplicam provas policiais, como AOCP e IDIB, com listas sob medida e o seu histórico.</p>
            </div>
            <div className="cc-grade">
              <CartaoCapa href="/entrar?modo=criar" tipo="banco" icone="escudo" rotulo="Todas as disciplinas" destaque="10" titulo="Plano grátis"
                texto="Crie sua conta e resolva questões todos os dias, com gabarito e resolução. Sem cartão de crédito." selo="Grátis"
                rodape={<Link href="/entrar?modo=criar" className="btn btn-azul">Criar conta grátis</Link>} />
              <CartaoCapa href={banco?.checkout_url ?? '/entrar?modo=criar'} tipo="completo" icone="banco" rotulo="Sem limite" destaque="∞" titulo="Banco completo"
                texto="Questões sem limite por dia, listas de até 60 questões e listas para imprimir com cartão-resposta."
                rodape={banco ? <a href={banco.checkout_url!} className="btn btn-azul">Desbloquear</a> : <span className="cc-info">Em breve.</span>} />
              <CartaoCapa href={cursoAberto?.checkout_url ?? '#editais'} tipo="trilha" icone={iconePorDisciplina('Direito')} rotulo="Curso por edital" destaque="120" titulo="Método 120"
                texto="Plano de estudo diário, aulas, simulados e o banco completo incluído."
                rodape={cursoAberto ? <a href={cursoAberto.checkout_url!} className="btn btn-linha">Conhecer o curso</a> : <span className="cc-info">Turmas em breve.</span>} />
            </div>
          </section>

          <section aria-labelledby="expert" className={`cartao ${styles.expert}`}>
            <img src={EXPERT.fotoRosto} alt={EXPERT.nome} width={180} height={180} className={styles.avatar} />
            <div className={styles.expertTexto}>
              <span className="rotulo">{EXPERT.chamada}</span>
              <h2 id="expert" className="display" style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 36px)' }}>{EXPERT.nome}</h2>
              <p className={styles.lead}>{EXPERT.resumo}</p>
              <ul className={styles.aprovacoes}>{EXPERT.aprovacoes.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          </section>
        </main>
      </div>

      <footer className={`tema-escuro ${styles.rodape}`}>
        <div className={`container ${styles.rodapeDentro}`}>
          <Logo120 tamanho={44} slogan />
          <span className="linha-flex" style={{ gap: 16 }}>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
          </span>
          <small style={{ opacity: 0.8, fontSize: 13 }}>{EMPRESA.razao} · CNPJ {EMPRESA.cnpj} · {EMPRESA.email}</small>
          <small style={{ opacity: 0.6, fontSize: 12 }}>{MARCA.nome} não tem vínculo com bancas organizadoras nem com os órgãos citados. Questões de provas oficiais são usadas para fins educacionais.</small>
        </div>
      </footer>
    </>
  );
}
