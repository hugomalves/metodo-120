'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Marca } from '@/components/Marca';

export default function NovaSenha() {
  const router = useRouter();
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const senha = String(f.get('senha'));
    if (senha !== String(f.get('confirma'))) return setErro('As duas senhas precisam ser iguais.');
    setEnviando(true); setErro('');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) return setErro('Não foi possível trocar a senha. Peça um novo link em "Esqueci minha senha".');
    await supabase.auth.signOut();
    router.push('/entrar?aviso=senha-alterada');
  }

  return (
    <div className="container">
      <header className="topo"><Marca /></header>
      <main className="cartao" style={{ maxWidth: 520, margin: '0 auto 56px', padding: 'clamp(24px, 4vw, 40px)', borderRadius: 4 }}>
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 className="display" style={{ margin: 0, fontSize: 28 }}>Escolha uma nova senha</h1>
          <div className="campo"><label htmlFor="senha">Nova senha</label><input id="senha" name="senha" type="password" minLength={8} required autoComplete="new-password" /></div>
          <div className="campo"><label htmlFor="confirma">Repita a nova senha</label><input id="confirma" name="confirma" type="password" minLength={8} required autoComplete="new-password" /></div>
          <button className="btn btn-azul btn-grande" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar nova senha'}</button>
          {erro && <p role="alert" className="erro" style={{ margin: 0 }}>{erro}</p>}
        </form>
      </main>
    </div>
  );
}
