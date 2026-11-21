import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { buscarQuestoes } from '@/lib/banco';
import { AbasBanco } from '../AbasBanco';
import { criarCadernoDeErros } from '../acoes';
import b from '../banco.module.css';
import s from '../../aluno.module.css';

export const metadata = { title: 'Cadernos de erros' };
export const dynamic = 'force-dynamic';

export default async function CadernosDeErros({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, perfil } = await acessoAtual();
  // erradas = a última vez que o aluno respondeu a questão, ele errou
  const { lista } = await buscarQuestoes(supabase, perfil.id, { s: 'erradas' });
  const porDisc = new Map<string, number>();
  lista.forEach((q) => porDisc.set(q.disciplina, (porDisc.get(q.disciplina) ?? 0) + 1));
  const linhas = Array.from(porDisc.entries()).sort((a, c) => c[1] - a[1] || a[0].localeCompare(c[0], 'pt-BR'));

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Cadernos de erros' }]} />
      <AbasBanco ativa="erros" />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Cadernos de erros</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          As questões que você errou na última tentativa, por disciplina. Refaça direto ou guarde num caderno (na pasta “Cadernos de erros”). Acertou de novo? Ela sai da lista.
        </p>
      </div>
      {sp.limite && <p role="alert" className="erro" style={{ margin: 0 }}>Você já criou muitos cadernos hoje. Termine os que estão abertos.</p>}

      {linhas.length === 0 ? (
        <section className={`cartao ${b.bloco}`}>
          <p style={{ margin: 0 }}>Você não tem erros para rever. 🎉</p>
          <p className="suave" style={{ margin: 0 }}>Quando errar alguma questão, ela aparece aqui.</p>
          <Link href="/aluno/questoes/filtrar" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>Filtrar questões</Link>
        </section>
      ) : (
        <section className="cartao" aria-label="Erros por disciplina">
          <div className={b.linhaErro}>
            <span className={b.numErro}>{lista.length}</span>
            <div className={b.nome}><b>Todas as disciplinas</b><span className="suave" style={{ fontSize: 13 }}>Tudo o que você errou por último</span></div>
            <div className="linha-flex" style={{ gap: 8 }}>
              <Link href="/aluno/questoes/resolver?s=erradas" className="btn btn-azul">Refazer</Link>
              <form action={criarCadernoDeErros}><button className="btn btn-linha">Criar caderno</button></form>
            </div>
          </div>
          {linhas.map(([d, n]) => (
            <div key={d} className={b.linhaErro}>
              <span className={b.numErro}>{n}</span>
              <div className={b.nome}><b>{d}</b></div>
              <div className="linha-flex" style={{ gap: 8 }}>
                <Link href={`/aluno/questoes/resolver?s=erradas&d=${encodeURIComponent(d)}`} className="btn btn-azul">Refazer</Link>
                <form action={criarCadernoDeErros}><input type="hidden" name="disciplina" value={d} /><button className="btn btn-linha">Criar caderno</button></form>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
