'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import s from '../../aluno.module.css';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export function CartaoResposta({
  simuladoId, alunoId, n, inicial, salvarRascunho,
}: { simuladoId: string; alunoId: string; n: number; inicial: string; salvarRascunho: boolean }) {
  const router = useRouter();
  const [resp, setResp] = useState<string[]>(() =>
    Array.from({ length: n }, (_, i) => (LETRAS.includes(inicial[i]) ? inicial[i] : '-')),
  );
  const [salvo, setSalvo] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const primeiraVez = useRef(true);

  // salva o rascunho 1 segundo depois da última marcação
  useEffect(() => {
    if (primeiraVez.current) { primeiraVez.current = false; return; }
    if (!salvarRascunho) return;
    const t = setTimeout(async () => {
      const { error } = await createClient().from('rascunhos_cartao').upsert({
        aluno_id: alunoId, simulado_id: simuladoId, respostas: resp.join(''), atualizado_em: new Date().toISOString(),
      });
      setSalvo(error ? 'Não foi possível salvar o rascunho agora.' : 'Rascunho salvo.');
    }, 1000);
    return () => clearTimeout(t);
  }, [resp, alunoId, simuladoId, salvarRascunho]);

  const respondidas = resp.filter((r) => r !== '-').length;

  function marcar(i: number, L: string) {
    setConfirmar(false);
    setResp((atual) => atual.map((r, j) => (j === i ? (r === L ? '-' : L) : r)));
  }

  async function enviar() {
    setEnviando(true); setErro('');
    const { error } = await createClient().rpc('enviar_cartao', { p_simulado: simuladoId, p_respostas: resp.join('') });
    setEnviando(false);
    if (error) return setErro(error.message || 'Não foi possível enviar. Tente de novo.');
    router.replace(`/aluno/simulado/${simuladoId}`);
    router.refresh();
  }

  return (
    <>
      <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
        <span className="mono" style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--cartao)', border: '1px solid var(--linha)' }}>
          Respondidas {respondidas} de {n}
        </span>
        <span role="status" className="suave" style={{ fontSize: 14 }}>{salvo}</span>
      </div>

      <div className={`cartao ${s.cartao}`}>
        {resp.map((r, i) => (
          <div key={i} className={s.questao}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {LETRAS.map((L) => (
              <button
                key={L}
                type="button"
                aria-label={`Questão ${i + 1}, alternativa ${L}`}
                aria-pressed={r === L}
                className={`${s.alt} ${r === L ? s.altMarcada : ''}`}
                onClick={() => marcar(i, L)}
              >
                {L}
              </button>
            ))}
          </div>
        ))}
      </div>

      {!confirmar ? (
        <button className="btn btn-ciano btn-grande" style={{ alignSelf: 'flex-start' }} onClick={() => (respondidas < n ? setConfirmar(true) : enviar())} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar respostas'}
        </button>
      ) : (
        <div className="cartao" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, borderColor: 'var(--laranja)' }}>
          <strong>Você deixou {n - respondidas} {n - respondidas === 1 ? 'questão' : 'questões'} em branco. Enviar mesmo assim?</strong>
          <div className="linha-flex">
            <button className="btn btn-ciano" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Sim, enviar'}</button>
            <button className="btn btn-linha" onClick={() => setConfirmar(false)}>Voltar e revisar</button>
          </div>
        </div>
      )}
      {erro && <p role="alert" className="erro" style={{ margin: 0 }}>{erro}</p>}
    </>
  );
}
