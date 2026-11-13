import { notFound } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { FormAcao } from '@/app/professor/FormAcao';
import { salvarDadosComprador } from '../../actions';
import { formatarCpf, formatarTelefone } from '@/lib/documentos';
import s from '../../aluno.module.css';

export const metadata = { title: 'Meu PDF' };

// O PDF que o aluno comprou: sai com o nome, o CPF e o telefone dele em todas as páginas
export default async function Material({ params }: { params: Promise<{ produtoId: string }> }) {
  const { produtoId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(produtoId)) notFound();
  const { supabase } = await acessoAtual();
  const { data: pode } = await supabase.rpc('pode_baixar_pdf', { p_produto: produtoId });
  if (!pode) notFound();
  const { data: prod } = await supabase.from('produtos').select('nome').eq('id', produtoId).maybeSingle();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: dados } = await supabase.from('dados_comprador').select('nome, cpf, telefone').eq('email', (user?.email ?? '').toLowerCase()).maybeSingle();
  const d = dados as { nome: string; cpf: string; telefone: string } | null;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Cursos em PDF', href: '/aluno/cursos' }, { rotulo: 'Meu PDF' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>{(prod as { nome: string } | null)?.nome ?? 'Meu PDF'}</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Este PDF é só seu. Ele sai com o seu nome, CPF e telefone em todas as páginas, para proteger o material contra cópia e revenda.
        </p>
      </div>
      {d ? (
        <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
          <div>
            <span className="rotulo">Marca d&apos;água do seu PDF</span>
            <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{d.nome}</p>
            <p className="suave" style={{ margin: 0 }}>CPF {formatarCpf(d.cpf)} · {formatarTelefone(d.telefone)}</p>
          </div>
          <div className="linha-flex">
            <a href={`/api/material/${produtoId}`} target="_blank" rel="noopener" className="btn btn-azul">Abrir meu PDF</a>
          </div>
          <p className="suave" style={{ margin: 0, fontSize: 13.5 }}>
            Os dados vêm da sua compra. Se algo estiver errado, escreva para o suporte. Se o arquivo for grande, a preparação pode levar alguns segundos.
          </p>
        </section>
      ) : (
        <section className="cartao" style={{ padding: 20, maxWidth: 560 }}>
          <h2 className="display" style={{ marginTop: 0 }}>Confirme seus dados</h2>
          <p className="suave">Para liberar o PDF, informe uma vez o nome completo, o CPF e o telefone de quem comprou. Eles aparecem no PDF e não podem ser trocados depois.</p>
          <FormAcao acao={salvarDadosComprador} botao="Salvar e liberar o PDF">
            <div className="campo"><label htmlFor="dn">Nome completo</label><input id="dn" name="nome" required autoComplete="name" /></div>
            <div className="campo"><label htmlFor="dc">CPF</label><input id="dc" name="cpf" required inputMode="numeric" placeholder="000.000.000-00" /></div>
            <div className="campo"><label htmlFor="dt">Telefone com DDD</label><input id="dt" name="telefone" required inputMode="tel" autoComplete="tel" placeholder="(81) 99999-9999" /></div>
          </FormAcao>
        </section>
      )}
    </>
  );
}
