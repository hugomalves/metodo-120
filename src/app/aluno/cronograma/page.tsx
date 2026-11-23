import Link from 'next/link';
import { redirect } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { todasAsLinhas } from '@/lib/paginar';
import {
  chaveDe, estruturaEdital, hojeBr, inicioDaSemana, somarDias, valido,
  type Config, type Estudo, type Item, type Progresso, type Revisao,
} from '@/lib/cronograma';
import { seguirEdital } from '../actions';
import { FormAcao } from '@/app/professor/FormAcao';
import { RegistrarEstudo, type OpcaoDisciplina } from './Interativos';
import { novaRevisao, salvarCronograma } from './actions';
import {
  Abas, AbaCalendario, AbaCronograma, AbaEdital, AbaHistorico, AbaRevisoes, PERIODOS, SUBS, Topo,
  type Aba, type Aproveitamento, type Base,
} from './Vistas';
import s from './cronograma.module.css';

export const metadata = { title: 'Cronograma' };

type Busca = Record<string, string | undefined>;

export default async function Cronograma({ searchParams }: { searchParams: Promise<Busca> }) {
  const sp = await searchParams;
  const { supabase, perfil } = await acessoAtual();
  const hoje = hojeBr();
  const aba: Aba = (['cronograma', 'revisoes', 'historico', 'calendario', 'edital'] as const).find((a) => a === sp.aba) ?? 'cronograma';

  const { data: eds } = await supabase.from('editais').select('id, nome, data_prova').eq('publicado', true).order('data_prova', { nullsFirst: false });
  const editais = (eds ?? []) as { id: string; nome: string; data_prova: string | null }[];
  const edital = editais.find((e) => e.id === perfil.edital_id) ?? null;
  const { data: cfgRaw } = edital
    ? await supabase.from('cronogramas').select('edital_id, inicio, blocos_por_dia, dias_semana, intervalos').eq('aluno_id', perfil.id).eq('edital_id', edital.id).maybeSingle()
    : { data: null };
  const config = cfgRaw as Config | null;
  // quem tem a Reta Final PM PE e ainda não montou um cronograma próprio vai direto para o plano do curso
  const { data: retaFinal } = await supabase.rpc('tem_curso', { p_slug: 'reta-final-pmpe' });
  if (retaFinal && !config && sp.configurar !== '1') redirect('/aluno/cronograma/reta-final');

  // sem edital ou sem cronograma: tela de montar o cronograma
  if (!edital || !config || sp.configurar === '1') {
    return (
      <div className={s.pagina}>
        <div className={s.boasVindas}>
          <span className={s.rotuloTopo}>Cronograma</span>
          <h1>Monte o seu cronograma de estudos</h1>
          <p>Escolha o edital, quantos blocos de estudo cabem no seu dia e em que dias você estuda. O site distribui os assuntos do edital, intercalando as disciplinas e dando mais espaço às que têm mais questões na prova. As revisões são agendadas sozinhas quando você registra o estudo.</p>
        </div>
        <section className={s.painelBloco} style={{ padding: 22 }}>
          {editais.length === 0 ? <p className={s.vazio}>Nenhum edital publicado ainda.</p> : (
            <FormAcao acao={salvarCronograma} botao={config ? 'Salvar e refazer o cronograma' : 'Criar meu cronograma'}>
              <div className={s.formGrade}>
                <label className={s.campoEscuro}><span>Edital</span>
                  <select name="edital" defaultValue={edital?.id ?? editais[0].id} required>
                    {editais.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </label>
                <label className={s.campoEscuro}><span>Blocos de estudo por dia</span>
                  <select name="blocos" defaultValue={config?.blocos_por_dia ?? 2}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'bloco' : 'blocos'} (cerca de {n * 50} min)</option>)}
                  </select>
                </label>
                <label className={s.campoEscuro}><span>Começar em</span><input type="date" name="inicio" defaultValue={hoje} min={hoje} /></label>
              </div>
              <fieldset className={s.chipsCampo}>
                <legend>Dias de estudo</legend>
                <div className={s.chips}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
                    <label key={d}><input type="checkbox" name="dias" value={i} defaultChecked={(config?.dias_semana ?? [1, 2, 3, 4, 5, 6]).includes(i)} />{d}</label>
                  ))}
                </div>
              </fieldset>
              <fieldset className={s.chipsCampo}>
                <legend>Intervalos de revisão (dias depois do estudo)</legend>
                <div className={s.chips}>
                  {[1, 7, 14, 30, 90, 120].map((n) => (
                    <label key={n}><input type="checkbox" name="intervalos" value={n} defaultChecked={(config?.intervalos ?? [1, 7, 14, 30]).includes(n)} />{n} {n === 1 ? 'dia' : 'dias'}</label>
                  ))}
                </div>
              </fieldset>
              {config && <p className={s.vazio} style={{ textAlign: 'left', padding: 0 }}>Refazer mantém o que você já concluiu e reprograma só os assuntos pendentes.</p>}
            </FormAcao>
          )}
          {config && <p style={{ margin: '14px 0 0' }}><Link href="/aluno/cronograma">← Voltar ao cronograma</Link></p>}
        </section>
      </div>
    );
  }

  // dados comuns
  const [estrutura, itens, progressoRaw] = await Promise.all([
    estruturaEdital(supabase, edital.id),
    todasAsLinhas<Item>((de, ate) => supabase.from('cronograma_itens').select('disciplina, chave, assunto_id, dia, ordem')
      .eq('aluno_id', perfil.id).eq('edital_id', edital.id).order('dia').order('ordem').order('disciplina').order('chave').range(de, ate)),
    todasAsLinhas<Progresso>((de, ate) => supabase.from('conteudos_progresso').select('disciplina, chave, teoria, revisoes')
      .eq('aluno_id', perfil.id).eq('edital_id', edital.id).order('disciplina').order('chave').range(de, ate)),
  ]);
  const mapa = new Map(estrutura.flatMap((d) => d.linhas).map((c) => [chaveDe(c.disciplina, c.chave), c]));
  const progresso = new Map(progressoRaw.map((p) => [chaveDe(p.disciplina, p.chave), p]));
  const b: Base = { hoje, edital, estrutura, mapa, progresso, itens };

  const precisaRevisoes = aba === 'cronograma' || aba === 'revisoes' || aba === 'calendario';
  const revisoes = precisaRevisoes
    ? await todasAsLinhas<Revisao>((de, ate) => supabase.from('revisoes').select('id, edital_id, disciplina, chave, assunto_nome, numero, dia, feita_em')
      .eq('aluno_id', perfil.id).or(`edital_id.eq.${edital.id},edital_id.is.null`).order('dia').order('id').range(de, ate))
    : [];

  const opcoes: OpcaoDisciplina[] = estrutura.map((d) => ({
    nome: d.nome,
    conteudos: d.folhas.filter((c) => c.chave !== 'geral').map((c) => ({ chave: c.chave, nome: c.nome })),
  }));
  const minutosCronometro = sp.registrar && /^\d{1,4}$/.test(sp.registrar) ? Math.min(1440, Number(sp.registrar)) : null;

  let conteudo: React.ReactNode = null;
  if (aba === 'cronograma') {
    const semana = valido(sp.semana) ? inicioDaSemana(sp.semana) : inicioDaSemana(hoje);
    conteudo = <AbaCronograma b={b} revisoes={revisoes} semana={semana} />;
  } else if (aba === 'revisoes') {
    const sub = SUBS.some((x) => x.id === sp.sub) ? sp.sub! : 'pendentes';
    const nova = (
      <details className={s.novaRevisao}>
        <summary className={s.btnPrimario}>+ Nova revisão</summary>
        <div className={s.novaRevisaoCaixa}>
          <FormAcao acao={novaRevisao} botao="Agendar revisão">
            <input type="hidden" name="edital" value={edital.id} />
            <label className={s.campoEscuro}><span>Assunto</span>
              <select name="conteudo" required>
                {opcoes.map((o) => (
                  <optgroup key={o.nome} label={o.nome}>
                    <option value={`${o.nome}::`}>{o.nome} (disciplina inteira)</option>
                    {o.conteudos.map((c) => <option key={c.chave} value={`${o.nome}::${c.chave}`}>{c.nome}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className={s.campoEscuro}><span>Dia</span><input type="date" name="dia" defaultValue={somarDias(hoje, 1)} required /></label>
          </FormAcao>
        </div>
      </details>
    );
    conteudo = <AbaRevisoes b={b} revisoes={revisoes} sub={sub} disc={sp.disc ?? ''} nova={nova} />;
  } else if (aba === 'historico') {
    const periodo = PERIODOS.some((x) => x.id === sp.periodo) ? sp.periodo! : '7';
    const estudos = await todasAsLinhas<Estudo>((de, ate) => supabase.from('estudos').select('id, edital_id, disciplina, chave, assunto_nome, dia, minutos, tipo, observacoes')
      .eq('aluno_id', perfil.id).gte('dia', somarDias(hoje, -371)).order('dia').order('id').range(de, ate));
    conteudo = <AbaHistorico b={b} estudos={estudos} periodo={periodo} disc={sp.disc ?? ''} tipo={sp.tipo ?? ''} />;
  } else if (aba === 'calendario') {
    const mes = sp.mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.mes) ? sp.mes : hoje.slice(0, 7);
    conteudo = <AbaCalendario b={b} revisoes={revisoes} mes={mes} />;
  } else {
    const { data: ap } = await supabase.rpc('aproveitamento_edital', { p_edital: edital.id });
    const aprov: Aproveitamento = new Map(((ap ?? []) as { disciplina: string; assunto: string; meus_acertos: number; meus_total: number; outros_acertos: number; outros_total: number }[])
      .map((x) => [`${x.disciplina}::${x.assunto}`, { meus: [x.meus_acertos, x.meus_total], outros: [x.outros_acertos, x.outros_total] }]));
    conteudo = <AbaEdital b={b} aprov={aprov} disc={sp.disc ?? ''} />;
  }

  return (
    <div className={s.pagina}>
      <Topo b={b} editais={editais} trocar={seguirEdital} />
      <div className={s.abasLinha}>
        <Abas atual={aba} retaFinal={!!retaFinal} />
        <Link href="/aluno/cronograma?configurar=1" className={s.ajustar}>Ajustar cronograma</Link>
      </div>
      {conteudo}
      <RegistrarEstudo key={minutosCronometro ?? 'x'} edital={edital.id} editalNome={edital.nome} opcoes={opcoes} hoje={hoje}
        intervalos={config.intervalos} diasPadrao={[0, 1, 2, 3, 4, 5, 6]} abrirComMinutos={minutosCronometro} />
    </div>
  );
}
