import Link from 'next/link';
import { exigirLogin } from '@/lib/sessao';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { Formulario } from '@/components/Formulario';
import { excluirConta, participarRanking } from '@/app/conta/actions';
import s from '../aluno.module.css';

export const metadata = { title: 'Minha conta' };

export default async function MinhaConta() {
  const { supabase, user, perfil } = await exigirLogin();
  const [{ data: matsRaw }] = await Promise.all([
    supabase.from('matriculas').select('status, criado_em, produto:produtos(nome, acesso_ate)').eq('aluno_id', perfil.id).order('criado_em', { ascending: false }),
  ]);
  const matriculas = (matsRaw ?? []) as unknown as { status: string; criado_em: string; produto: { nome: string; acesso_ate: string | null } | null }[];
  const data = (d: string) => new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR');

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Minha conta' }]} />
      <h1 className={`display ${s.titulo}`}>Minha conta</h1>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 8 }} aria-labelledby="dados">
        <h2 id="dados" className="display" style={{ margin: 0, fontSize: 19 }}>Seus dados</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>Guardamos só o necessário para o curso funcionar.</p>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', gap: '6px 18px' }}>
          <dt className="suave">Nome</dt><dd style={{ margin: 0 }}>{perfil.nome || '–'}</dd>
          <dt className="suave">E-mail</dt><dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{user.email}</dd>
          <dt className="suave">Ano de nascimento</dt><dd style={{ margin: 0 }}>{perfil.ano_nascimento ?? '–'}</dd>
          <dt className="suave">Apelido no ranking</dt><dd style={{ margin: 0 }}>{perfil.apelido ?? 'nenhum'}</dd>
        </dl>
        {matriculas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            <span className={s.rotuloPeq}>Seus acessos</span>
            {matriculas.map((m, i) => (
              <span key={i}>
                {m.produto?.nome ?? 'Curso'} · {m.status === 'ativa' ? (m.produto?.acesso_ate ? `ativo até ${data(m.produto.acesso_ate)}` : 'ativo') : m.status === 'reembolsada' ? 'reembolsado' : 'encerrado'}
              </span>
            ))}
          </div>
        )}
        <p className="suave" style={{ margin: '6px 0 0', fontSize: 14 }}>
          Para corrigir nome ou ano de nascimento, fale com a equipe do curso. Veja também a <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </section>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="apel">
        <h2 id="apel" className="display" style={{ margin: 0, fontSize: 19 }}>Apelido no ranking</h2>
        <Formulario acao={participarRanking} botao="Salvar apelido">
          <input type="hidden" name="participar" value={perfil.participa_ranking ? 'sim' : 'nao'} />
          <div className="campo" style={{ maxWidth: 320 }}>
            <label htmlFor="apelido">Apelido</label>
            <input id="apelido" name="apelido" type="text" required minLength={3} maxLength={20} defaultValue={perfil.apelido ?? ''} placeholder="Ex.: rumo_a_posse" />
            <span className="suave" style={{ fontSize: 13 }}>É o único nome que aparece para os colegas. Não use o seu nome completo.</span>
          </div>
        </Formulario>
      </section>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, borderColor: 'var(--erro-fundo)' }} aria-labelledby="excluir">
        <h2 id="excluir" className="display" style={{ margin: 0, fontSize: 19 }}>Excluir minha conta</h2>
        <p style={{ margin: 0, color: 'var(--texto-2)', maxWidth: '70ch' }}>
          Apaga o seu cadastro, o seu progresso e as suas dúvidas. Não dá para desfazer.
          O acesso ao curso termina na hora. Se você comprou há menos de 7 dias e quer o reembolso, peça na Kiwify antes de excluir.
        </p>
        <details>
          <summary className="btn btn-linha" style={{ listStyle: 'none', borderColor: 'var(--erro)', color: 'var(--erro)' }}>Quero excluir minha conta</summary>
          <div style={{ paddingTop: 12, maxWidth: 420 }}>
            <Formulario acao={excluirConta} botao="Excluir definitivamente" classeBotao="btn btn-perigo" pendenteTexto="Excluindo…">
              <div className="campo">
                <label htmlFor="conf">Digite EXCLUIR para confirmar</label>
                <input id="conf" name="confirmacao" type="text" required autoComplete="off" />
              </div>
              <div className="campo">
                <label htmlFor="senhaexc">Sua senha</label>
                <input id="senhaexc" name="senha" type="password" required autoComplete="current-password" />
              </div>
            </Formulario>
          </div>
        </details>
      </section>
    </>
  );
}
