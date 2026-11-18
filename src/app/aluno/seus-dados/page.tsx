import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { FormAcao } from '@/app/professor/FormAcao';
import { salvarDadosComprador } from '../actions';
import { formatarCpf, formatarTelefone } from '@/lib/documentos';

export const metadata = { title: 'Meus dados' };

// Dados que vão na marca d'água dos PDFs (quem se cadastrou antes de pedirmos CPF e telefone informa aqui, uma vez)
export default async function SeusDados({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar } = await searchParams;
  const volta = voltar && /^\/(?!\/)/.test(voltar) ? voltar : '/materiais';
  const { supabase } = await acessoAtual();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('dados_comprador').select('nome, cpf, telefone').eq('email', (user?.email ?? '').toLowerCase()).maybeSingle();
  const d = data as { nome: string; cpf: string; telefone: string } | null;
  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Meus dados' }]} />
      <h1 className="display" style={{ margin: 0 }}>Meus dados</h1>
      {d ? (
        <section className="cartao" style={{ padding: 20, maxWidth: 560 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{d.nome}</p>
          <p className="suave" style={{ margin: '4px 0 12px' }}>CPF {formatarCpf(d.cpf)} · {formatarTelefone(d.telefone)}</p>
          <p className="suave" style={{ fontSize: 14 }}>Estes dados saem na marca d&apos;água dos seus PDFs. Para corrigir algo, escreva para o suporte.</p>
          <Link href={volta} className="btn btn-azul">Continuar</Link>
        </section>
      ) : (
        <section className="cartao" style={{ padding: 20, maxWidth: 560 }}>
          <p className="suave">Para baixar PDFs, informe uma vez o nome completo, o CPF e o telefone. Eles aparecem como marca d&apos;água no arquivo, para proteger o material contra cópia e revenda, e não podem ser trocados depois.</p>
          <FormAcao acao={salvarDadosComprador} botao="Salvar">
            <div className="campo"><label htmlFor="dn">Nome completo</label><input id="dn" name="nome" required autoComplete="name" /></div>
            <div className="campo"><label htmlFor="dc">CPF</label><input id="dc" name="cpf" required inputMode="numeric" placeholder="000.000.000-00" /></div>
            <div className="campo"><label htmlFor="dt">Telefone com DDD</label><input id="dt" name="telefone" required inputMode="tel" autoComplete="tel" placeholder="(81) 99999-9999" /></div>
          </FormAcao>
          <p style={{ marginTop: 12 }}><Link href={volta}>Depois de salvar, voltar aos materiais →</Link></p>
        </section>
      )}
    </>
  );
}
