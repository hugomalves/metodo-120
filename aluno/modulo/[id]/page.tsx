import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { carregarTrilha, rotuloAula } from '@/lib/conteudo';
import { Capa, iconePorTitulo } from '@/components/Capa';
import { doisDigitos, linksCapas } from '@/lib/capas';
import s from '../../aluno.module.css';

export default async function ModuloPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil } = await exigirCurso();
  const trilha = await carregarTrilha(supabase, perfil);
  const m = trilha.modulos.find((x) => x.id === id);
  if (!m) notFound();
  const capa = m.capa_path ? (await linksCapas(supabase, [m.capa_path])).get(m.capa_path) : null;
  const feitas = m.aulas.filter((a) => a.concluida).length;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Aulas', href: '/aluno/trilha' }, { rotulo: `Módulo ${m.numero}` }]} />
      <div className="cc" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <span className="cc-capa" style={{ flex: '1 1 300px', maxWidth: 420 }}>
          {capa ? <img src={capa} alt="" /> : <Capa tipo="modulo" rotulo={`Módulo ${doisDigitos(m.numero)}`} destaque={doisDigitos(m.numero)} icone={iconePorTitulo(m.titulo)} titulo={m.titulo} />}
        </span>
        <div className="cc-corpo" style={{ flex: '1 1 280px', justifyContent: 'center', padding: '20px 24px' }}>
          <span className="cc-sobre">Módulo {doisDigitos(m.numero)}</span>
          <h1 className={`display ${s.titulo}`}>{m.titulo}</h1>
          <p className="suave" style={{ margin: 0 }}>{feitas} de {m.aulas.length} aulas concluídas</p>
          {m.aulas.length > 0 && <span className="cc-progresso" style={{ maxWidth: 360 }}><span style={{ width: `${Math.round((100 * feitas) / m.aulas.length)}%` }} /></span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {m.aulas.map((a) => (
          <Link key={a.id} href={`/aluno/aula/${a.id}`} className={`cartao ${s.linhaLista}`} style={{ textDecoration: 'none', color: 'var(--texto)' }}>
            <span className="mono suave" style={{ width: 130 }}>{rotuloAula(a)}</span>
            <strong style={{ flex: '1 1 240px', minWidth: 0 }}>{a.titulo}</strong>
            <span className="suave" style={{ fontSize: 14 }}>{a.duracao_min} min</span>
            <span className={`${s.chip} ${a.concluida ? s.chipOk : s.chipNeutro}`}>{a.concluida ? 'Concluída' : 'A fazer'}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
