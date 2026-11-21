import Link from 'next/link';
import { redirect } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CHAVES } from '@/lib/filtros';
import { minhasTentativas, respostasDasListas } from '@/lib/questao';
import { AbasBanco } from './AbasBanco';
import { AvisosCarrossel, type Aviso } from './AvisosCarrossel';
import { IconeCaderno, IconePasta } from './Icones';
import b from './banco.module.css';
import s from '../aluno.module.css';

export const metadata = { title: 'Banco de questões' };

type Caderno = { id: string; titulo: string; questoes: string[]; pasta_id: string | null; criada_em: string };

// links antigos (com filtros) continuam funcionando: vão direto para as questões
const CHAVES_ANTIGAS: string[] = [...CHAVES, 's', 'm', 'todos', 'h', 'p', 'pp'];

export default async function BancoHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (CHAVES_ANTIGAS.some((k) => sp[k])) {
    const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    redirect(`/aluno/questoes/resolver?${q.toString()}`);
  }
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ data: av }, { data: cad }, tentativas] = await Promise.all([
    supabase.from('avisos_banco').select('id, titulo, texto, link_url, link_texto').eq('ativo', true).order('ordem').order('criado_em', { ascending: false }).limit(10),
    supabase.from('listas_questoes').select('id, titulo, questoes, pasta_id, criada_em').eq('aluno_id', perfil.id).order('criada_em', { ascending: false }).limit(6),
    minhasTentativas(supabase, perfil.id),
  ]);
  const cadernos = (cad ?? []) as Caderno[];
  const respostas = await respostasDasListas(supabase, perfil.id, cadernos);
  const ultima = new Map<string, boolean>();
  tentativas.forEach((t) => { if (!ultima.has(t.questao_id)) ultima.set(t.questao_id, t.acertou); });
  const resolvidas = ultima.size;
  const acertadas = Array.from(ultima.values()).filter(Boolean).length;
  const erradas = resolvidas - acertadas;
  const avisos: Aviso[] = (av ?? []) as Aviso[];
  if (!avisos.length) avisos.push({ id: 'padrao', titulo: 'Bem-vindo ao banco de questões', texto: 'Filtre por matéria, assunto e banca, guarde as questões em cadernos e refaça os seus erros.', link_url: '/aluno/questoes/filtrar', link_texto: 'Filtrar questões' });

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões' }]} />
      <AbasBanco ativa="home" />
      <div className={s.cabeca}><h1 className={`display ${s.titulo}`}>Meus Estudos</h1></div>

      {!acesso.completo && (
        <div className="q-plano" role="status">
          <span><b>Plano grátis:</b> {acesso.usadasHoje} de {acesso.limiteDia} questões respondidas hoje.</span>
          <Link href="/aluno/planos">Responder sem limite</Link>
        </div>
      )}

      <div className={b.homeGrade}>
        <div className={b.coluna}>
          <section className={`cartao ${b.bloco}`} aria-labelledby="avisos">
            <h2 id="avisos" className="display">Avisos</h2>
            <AvisosCarrossel avisos={avisos} />
          </section>

          <section className={`cartao ${b.bloco}`} aria-labelledby="cadernos">
            <h2 id="cadernos" className="display">Cadernos de estudo</h2>
            <div className={b.subabas}>
              <b>Recentes</b>
              <Link href="/aluno/questoes/cadernos">Pastas</Link>
              <Link href="/aluno/questoes/cadernos">Ver todos ›</Link>
            </div>
            {cadernos.length === 0 && <p className="suave" style={{ margin: 0 }}>Você ainda não criou nenhum caderno. Filtre as questões e guarde numa pasta.</p>}
            <div>
              {cadernos.map((c) => {
                const r = respostas.get(c.id) ?? new Map<string, boolean>();
                const feitas = c.questoes.filter((q) => r.has(q)).length;
                return (
                  <div key={c.id} className={b.itemCaderno}>
                    <IconeCaderno />
                    <Link href={`/aluno/questoes/lista/${c.id}`}>{c.titulo} <span className={b.progresso}>({feitas}/{c.questoes.length})</span></Link>
                    <Link href={`/aluno/questoes/cadernos${c.pasta_id ? `?pasta=${c.pasta_id}` : ''}`} className={b.pastaLink} aria-label="Abrir a pasta deste caderno" title="Abrir a pasta"><IconePasta /></Link>
                  </div>
                );
              })}
            </div>
            <Link href="/aluno/questoes/filtrar" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>Criar novo caderno de estudo</Link>
          </section>
        </div>

        <div className={b.coluna}>
          <section className={`cartao ${b.bloco}`} aria-labelledby="desempenho">
            <h2 id="desempenho" className="display">Desempenho</h2>
            <div className={b.numeros}>
              <div><b className="display">{resolvidas}</b><span>questões resolvidas</span></div>
              <div><b className="display">{resolvidas ? `${Math.round((100 * acertadas) / resolvidas)}%` : '—'}</b><span>de acertos</span></div>
              <div><b className="display">{acertadas}</b><span>acertos</span></div>
              <div><b className="display">{erradas}</b><span>para rever</span></div>
            </div>
            {erradas > 0
              ? <Link href="/aluno/questoes/erros" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Ver meus erros</Link>
              : <span className="suave" style={{ fontSize: 14 }}>Resolva algumas questões para ver seu desempenho aqui.</span>}
            <Link href="/aluno/estatisticas" style={{ fontSize: 14 }}>Ver estatísticas completas</Link>
          </section>
        </div>
      </div>
    </>
  );
}
