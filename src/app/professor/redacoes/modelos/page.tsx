import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { PROPOSTAS } from '@/lib/redacao';
import { FormAcao } from '../../FormAcao';
import { AbasProfRedacao } from '../AbasProfRedacao';
import { alternarModelo, salvarModelo } from '../acoes';
import styles from '../../professor.module.css';

export const metadata = { title: 'Redações-modelo · Painel do professor' };
export const dynamic = 'force-dynamic';

type M = { id: string; tema: string; nota: number | null; texto: string; comentario: string | null; publicada: boolean; ordem: number };

export default async function ModelosProfessor({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const editar = (await searchParams).editar;
  const supabase = await createClient();
  const { data, error } = await supabase.from('redacoes_exemplares').select('id, tema, nota, texto, comentario, publicada, ordem').order('ordem').order('criado_em', { ascending: false });
  const lista = (data ?? []) as M[];
  const atual = lista.find((m) => m.id === editar) ?? null;

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Redações', href: '/professor/redacoes' }, { rotulo: 'Redações-modelo' }]} />
      <h1 className={`display ${styles.titulo}`}>Redações-modelo</h1>
      <AbasProfRedacao ativa="modelos" />
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>As publicadas aparecem para os alunos na aba <b>Redações-modelo</b>. A mais recente (ou a de menor ordem) também vai para a IA como referência de nível na pré-correção.</p>
      {error && <p className="erro" role="alert">Falta rodar o SQL da redação (0018) no Supabase.</p>}

      <section className={`cartao ${styles.bloco}`} aria-labelledby="novo">
        <h2 id="novo" className="display">{atual ? 'Editar redação-modelo' : 'Nova redação-modelo'}</h2>
        <FormAcao key={atual?.id ?? 'nova'} acao={salvarModelo} botao={atual ? 'Salvar alterações' : 'Salvar redação-modelo'}>
          {atual && <input type="hidden" name="id" value={atual.id} />}
          <div className="campo">
            <label htmlFor="mt">Tema</label>
            <input id="mt" name="tema" maxLength={200} required list="temas-prop" defaultValue={atual?.tema ?? ''} />
            <datalist id="temas-prop">{PROPOSTAS.map((p) => <option key={p.slug} value={p.tema} />)}</datalist>
          </div>
          <div className="campo"><label htmlFor="mx">Texto da redação</label><textarea id="mx" name="texto" rows={14} required maxLength={6000} defaultValue={atual?.texto ?? ''} /></div>
          <div className="linha-flex">
            <div className="campo" style={{ width: 140 }}><label htmlFor="mn">Nota (0 a 40)</label><input id="mn" name="nota" type="number" min={0} max={40} defaultValue={atual?.nota ?? 38} /></div>
            <div className="campo" style={{ width: 140 }}><label htmlFor="mo">Ordem</label><input id="mo" name="ordem" type="number" defaultValue={atual?.ordem ?? 0} /></div>
          </div>
          <div className="campo"><label htmlFor="mc">Comentário do professor</label><textarea id="mc" name="comentario" rows={4} maxLength={2000} defaultValue={atual?.comentario ?? ''} placeholder="O que faz este texto ter nota alta: tese, argumentos, conectivos…" /></div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="publicada" defaultChecked={atual?.publicada ?? true} /> Publicar para os alunos</label>
        </FormAcao>
        {atual && <Link href="/professor/redacoes/modelos">Cancelar edição</Link>}
      </section>

      <section className={`cartao ${styles.bloco}`}>
        <h2 className="display">Cadastradas ({lista.length})</h2>
        {lista.length === 0 && <p className="suave" style={{ margin: 0 }}>Nenhuma ainda.</p>}
        {lista.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--linha)' }}>
            <div style={{ flex: 1, minWidth: 240 }}><b>{m.tema}</b><div className="suave" style={{ fontSize: 14 }}>Nota {m.nota ?? '—'}/40 · ordem {m.ordem}</div></div>
            <span className={`${styles.chip} ${m.publicada ? styles.chipOk : styles.chipNeutro}`}>{m.publicada ? 'Publicada' : 'Oculta'}</span>
            <Link href={`/professor/redacoes/modelos?editar=${m.id}`} className="btn btn-linha">Editar</Link>
            <form action={alternarModelo}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="publicar" value={m.publicada ? 'nao' : 'sim'} /><button className="btn btn-linha">{m.publicada ? 'Ocultar' : 'Publicar'}</button></form>
            <form action={alternarModelo}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="acao" value="apagar" /><button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Excluir</button></form>
          </div>
        ))}
      </section>
    </>
  );
}
