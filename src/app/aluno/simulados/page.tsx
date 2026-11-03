import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CartaoCapa } from '@/components/CartaoCapa';
import { destaqueSimulado, linksCapas } from '@/lib/capas';
import s from '../aluno.module.css';

export const metadata = { title: 'Simulados' };

type Sim = { id: string; codigo: string; tipo: string; trilha: string; n_questoes: number; semana: number | null; capa_path?: string | null };
type Envio = { simulado_id: string; acertos: number };

export default async function SimuladosPagina({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo = 'mini' } = await searchParams;
  const { supabase, perfil } = await exigirCurso();
  const t = tipo === 'completo' ? 'completo' : tipo === 'diagnostico' ? 'diagnostico' : 'mini';

  const [{ data: simsRaw }, { data: enviosRaw }] = await Promise.all([
    supabase.from('simulados').select('*').eq('tipo', t)
      .order('semana', { nullsFirst: false }).order('codigo'),
    supabase.from('envios').select('simulado_id, acertos').eq('aluno_id', perfil.id).eq('conta_evolucao', true),
  ]);
  const sims = ((simsRaw ?? []) as Sim[]).filter((x) => x.trilha === 'ambas' || x.trilha === perfil.trilha);
  const nota = new Map(((enviosRaw ?? []) as Envio[]).map((e) => [e.simulado_id, e.acertos]));
  const capas = await linksCapas(supabase, sims.map((x) => x.capa_path));
  const titulo = t === 'completo' ? 'Simulados completos' : t === 'diagnostico' ? 'Simulado diagnóstico' : 'Minissimulados';

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: titulo }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>{titulo}</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Imprima a prova, resolva no papel e lance só as respostas no cartão digital. Só o primeiro envio conta para a sua evolução.
        </p>
      </div>
      {sims.length === 0 && <p className="suave">Nenhum simulado liberado ainda.</p>}
      <div className="cc-grade">
        {sims.map((x) => {
          const feito = nota.has(x.id);
          const href = `/aluno/simulado/${x.id}`;
          const destaque = destaqueSimulado(x.codigo, x.semana);
          const rotulo = t === 'mini' ? (x.semana ? `Semana ${x.semana}` : 'Minissimulado') : t === 'completo' ? 'Simulado completo' : 'Diagnóstico';
          return (
            <CartaoCapa key={x.id} href={href} imagem={x.capa_path ? capas.get(x.capa_path) : null}
              tipo={t} rotulo={rotulo} destaque={destaque}
              titulo={x.semana ? `${t === 'mini' ? 'Minissimulado' : 'Simulado'} · Semana ${x.semana}` : x.codigo}
              texto={`${x.n_questoes} questões · código ${x.codigo}`}
              selo={feito ? `Feito · ${nota.get(x.id)}/${x.n_questoes}` : 'Disponível'}
              rodape={<Link href={href} className="btn btn-azul">{feito ? 'Ver resultado' : 'Abrir'}</Link>} />
          );
        })}
      </div>
    </>
  );
}
