import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CartaoCapa } from '@/components/CartaoCapa';
import { Formulario } from '@/components/Formulario';
import { gerarProva } from '../actions';
import s from '../aluno.module.css';

export const metadata = { title: 'Simulados' };

type Prova = { id: string; titulo: string; tipo: string; questoes: string[]; iniciada_em: string; finalizada_em: string | null; acertos: number | null; resultado: { classificado?: boolean; tem_regra?: boolean } | null };
type Edital = { id: string; nome: string; banca: string | null; corte_bloco: number | null; corte_total: number | null; sem_zerar: boolean; edital_disciplinas: { questoes: number }[] };

export default async function Provas() {
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ data: provasRaw }, { data: eds }] = await Promise.all([
    supabase.from('provas').select('id, titulo, tipo, questoes, iniciada_em, finalizada_em, acertos, resultado').eq('aluno_id', perfil.id).order('iniciada_em', { ascending: false }).limit(40),
    supabase.from('editais').select('id, nome, banca, corte_bloco, corte_total, sem_zerar, edital_disciplinas(questoes)').eq('publicado', true).order('data_prova', { nullsFirst: false }),
  ]);
  const provas = (provasRaw ?? []) as Prova[];
  const editais = (eds ?? []) as Edital[];
  const padrao = editais.find((e) => e.id === perfil.edital_id) ?? editais[0];
  const qtd = (e: Edital) => e.edital_disciplinas.reduce((t, d) => t + d.questoes, 0);

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Simulados' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Simulados no formato da prova</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '68ch' }}>
          As questões são sorteadas do banco na mesma distribuição do edital, priorizando as da banca e as que você ainda não fez.
          Você só vê a correção ao entregar, como na prova, e o resultado aplica a regra de corte do edital.
        </p>
      </div>

      {editais.length === 0 ? (
        <p className="suave">Nenhum edital publicado ainda.</p>
      ) : (
        <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderColor: 'var(--azul)' }} aria-labelledby="novo">
          <h2 id="novo" className="display" style={{ margin: 0, fontSize: 19 }}>Fazer um simulado</h2>
          <Formulario acao={gerarProva} botao="Começar o simulado" pendenteTexto="Sorteando as questões…">
            <div className={s.filtrosAluno}>
              <div className="campo">
                <label htmlFor="ped">Edital</label>
                <select id="ped" name="edital" defaultValue={padrao?.id}>
                  {editais.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="ptipo">Tamanho</label>
                <select id="ptipo" name="tipo" defaultValue={acesso.completo ? 'completo' : 'mini'}>
                  <option value="completo" disabled={!acesso.completo}>Simulado completo{padrao ? ` (${qtd(padrao)} questões)` : ''}{acesso.completo ? '' : ' · banco completo'}</option>
                  <option value="mini">Minissimulado (cerca de um quarto da prova)</option>
                </select>
              </div>
            </div>
            {padrao && (padrao.corte_bloco || padrao.corte_total || padrao.sem_zerar) && (
              <span className="suave" style={{ fontSize: 14 }}>
                Regra de corte do {padrao.nome}: {[padrao.corte_bloco ? `${Math.round(padrao.corte_bloco * 100)}% de cada bloco` : null, padrao.corte_total ? `${Math.round(padrao.corte_total * 100)}% do total` : null, padrao.sem_zerar ? 'sem zerar nenhuma disciplina' : null].filter(Boolean).join(', ')}.
              </span>
            )}
            {!acesso.completo && <span className="suave" style={{ fontSize: 14 }}>No plano grátis, você faz um minissimulado por dia. <Link href="/aluno/planos">Simulados completos no banco completo</Link>.</span>}
          </Formulario>
        </section>
      )}

      <section className={s.grupo} aria-labelledby="meus">
        <h2 id="meus" className="display">Meus simulados</h2>
        {provas.length === 0 && <p className="suave" style={{ margin: 0 }}>Você ainda não fez nenhum simulado.</p>}
        <div className="cc-grade">
          {provas.map((p) => {
            const feito = !!p.finalizada_em;
            const n = p.questoes.length;
            const href = `/aluno/provas/${p.id}`;
            return (
              <CartaoCapa key={p.id} href={href} tipo={p.tipo === 'completo' ? 'completo' : 'mini'} compacto rotulo={p.tipo === 'completo' ? 'Simulado completo' : 'Minissimulado'}
                destaque={feito ? `${p.acertos}/${n}` : String(n)} titulo={p.titulo}
                selo={feito ? (p.resultado?.tem_regra ? (p.resultado.classificado ? 'Passou no corte' : 'Abaixo do corte') : 'Entregue') : 'Em andamento'}
                texto={`${feito ? 'Entregue' : 'Começado'} em ${new Date(p.finalizada_em ?? p.iniciada_em).toLocaleDateString('pt-BR')}`}
                rodape={<Link href={href} className="btn btn-azul">{feito ? 'Ver resultado' : 'Continuar'}</Link>} />
            );
          })}
        </div>
      </section>
    </>
  );
}
