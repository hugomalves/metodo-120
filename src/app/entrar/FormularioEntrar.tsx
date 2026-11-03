'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './entrar.module.css';

type Modo = 'entrar' | 'criar' | 'esqueci';

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (m.includes('already registered')) return 'Já existe uma conta com este e-mail. Use "Entrar" ou "Esqueci minha senha".';
  if (m.includes('password should be')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (m.includes('rate limit')) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (m.includes('not authorized')) return 'Este e-mail ainda não pode receber mensagens do site (o envio de e-mails está em modo de teste).';
  if (m.includes('invalid')) return 'Confira o e-mail digitado.';
  return `Não foi possível concluir agora. Detalhe técnico: ${msg}`;
}

export function FormularioEntrar({ modoInicial, aviso }: { modoInicial: Modo; aviso?: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(
    aviso === 'link-invalido'
      ? 'Esse link expirou ou foi aberto em outro aparelho. Entre com e-mail e senha, ou peça um novo link.'
      : '',
  );
  const [ok, setOk] = useState(aviso === 'senha-alterada' ? 'Senha alterada. Entre com a nova senha.' : '');

  const supabase = createClient();
  const voltarPara = (caminho: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(caminho)}`;

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true); setErro(''); setOk('');
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')).trim(),
      password: String(f.get('senha')),
    });
    setEnviando(false);
    if (error) return setErro(traduzirErro(error.message));
    router.push('/aluno');
    router.refresh();
  }

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ano = String(f.get('ano') ?? '').trim();
    const anoAtual = new Date().getFullYear();
    if (!/^\d{4}$/.test(ano) || +ano < anoAtual - 100 || +ano > anoAtual) {
      return setErro('Informe o ano de nascimento com 4 dígitos, por exemplo 1998.');
    }
    // a plataforma é só para adultos
    if (anoAtual - +ano < 18 || f.get('maior') !== 'on') {
      return setErro('A plataforma é só para maiores de 18 anos. Confirme que você tem 18 anos ou mais.');
    }
    setEnviando(true); setErro(''); setOk('');
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get('email')).trim(),
      password: String(f.get('senha')),
      options: {
        emailRedirectTo: voltarPara('/boas-vindas'),
        data: { nome: String(f.get('nome')).trim(), ano_nascimento: ano, maior_idade: 'sim' },
      },
    });
    setEnviando(false);
    if (error) return setErro(traduzirErro(error.message));
    if (data.session) {
      router.push('/boas-vindas');
      router.refresh();
    } else {
      setOk('Conta criada. Enviamos um link de confirmação para o seu e-mail: abra-o para entrar.');
    }
  }

  async function esqueci(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true); setErro(''); setOk('');
    const { error } = await supabase.auth.resetPasswordForEmail(String(f.get('email')).trim(), {
      redirectTo: voltarPara('/nova-senha'),
    });
    setEnviando(false);
    if (error) return setErro(traduzirErro(error.message));
    setOk('Se houver uma conta com este e-mail, você vai receber um link para criar uma nova senha.');
  }

  return (
    <>
      {modo !== 'esqueci' && (
        <div role="tablist" aria-label="Entrar ou criar conta" className={styles.abas}>
          <button role="tab" aria-selected={modo === 'entrar'} className={`${styles.aba} ${modo === 'entrar' ? styles.abaAtiva : ''}`} onClick={() => { setModo('entrar'); setErro(''); }}>
            Entrar
          </button>
          <button role="tab" aria-selected={modo === 'criar'} className={`${styles.aba} ${modo === 'criar' ? styles.abaAtiva : ''}`} onClick={() => { setModo('criar'); setErro(''); }}>
            Criar conta
          </button>
        </div>
      )}

      {modo === 'entrar' && (
        <form onSubmit={entrar} className={styles.pilha}>
          <h1 className="display" style={{ margin: 0, fontSize: 30 }}>Entrar</h1>
          <div className="campo"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="seuemail@exemplo.com" /></div>
          <div className="campo"><label htmlFor="senha">Senha</label><input id="senha" name="senha" type="password" autoComplete="current-password" required placeholder="Sua senha" /></div>
          <button type="button" className={styles.link} onClick={() => { setModo('esqueci'); setErro(''); setOk(''); }}>Esqueci minha senha</button>
          <button type="submit" className="btn btn-azul btn-grande" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        </form>
      )}

      {modo === 'criar' && (
        <form onSubmit={criar} className={styles.pilha}>
          <h1 className="display" style={{ margin: 0, fontSize: 30 }}>Criar conta</h1>
          <div className="campo"><label htmlFor="nome">Nome</label><input id="nome" name="nome" type="text" autoComplete="given-name" required placeholder="Como quer ser chamado" /></div>
          <div className={styles.dupla}>
            <div className="campo" style={{ flexGrow: 2 }}><label htmlFor="email2">E-mail</label><input id="email2" name="email" type="email" autoComplete="email" required placeholder="seuemail@exemplo.com" /></div>
            <div className="campo"><label htmlFor="ano">Ano de nascimento</label><input id="ano" name="ano" type="text" inputMode="numeric" maxLength={4} required placeholder="1998" /></div>
          </div>
          <div className="campo"><label htmlFor="senha2">Senha</label><input id="senha2" name="senha" type="password" autoComplete="new-password" minLength={8} required placeholder="Pelo menos 8 caracteres" /></div>
          <label className={styles.check}>
            <input type="checkbox" name="maior" required />
            <span>Declaro que tenho 18 anos ou mais</span>
          </label>
          <button type="submit" className="btn btn-azul btn-grande" disabled={enviando}>{enviando ? 'Criando…' : 'Criar minha conta'}</button>
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>
            Ao criar a conta, você concorda com os <a href="/termos">Termos de uso</a> e a <a href="/privacidade">Política de privacidade</a>.
          </p>
        </form>
      )}

      {modo === 'esqueci' && (
        <form onSubmit={esqueci} className={styles.pilha}>
          <h1 className="display" style={{ margin: 0, fontSize: 30 }}>Criar uma nova senha</h1>
          <p className="suave" style={{ margin: 0 }}>Informe o e-mail da sua conta. Vamos enviar um link para você escolher uma nova senha.</p>
          <div className="campo"><label htmlFor="email3">E-mail</label><input id="email3" name="email" type="email" autoComplete="email" required placeholder="seuemail@exemplo.com" /></div>
          <button type="submit" className="btn btn-azul btn-grande" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar link'}</button>
          <button type="button" className={styles.link} onClick={() => { setModo('entrar'); setErro(''); setOk(''); }}>Voltar para entrar</button>
        </form>
      )}

      {erro && <p role="alert" className="erro" style={{ margin: 0 }}>{erro}</p>}
      {ok && <p role="status" className="ok" style={{ margin: 0 }}>{ok}</p>}
    </>
  );
}
