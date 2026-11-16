'use client';

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { marcarConteudo, registrarEstudo, type Res } from './actions';
import s from './cronograma.module.css';

export const EVENTO_REGISTRAR = 'm120:registrar-estudo';
type Detalhe = { conteudo?: string; minutos?: number };

// Botão que abre o quadro "Registrar estudo" (já com o conteúdo escolhido, se houver)
export function BotaoRegistrar({ conteudo, rotulo = 'Registrar', className }: { conteudo?: string; rotulo?: string; className?: string }) {
  return (
    <button type="button" className={className ?? s.btnRegistrar}
      onClick={() => window.dispatchEvent(new CustomEvent<Detalhe>(EVENTO_REGISTRAR, { detail: { conteudo } }))}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M10 2h4" /></svg>
      {rotulo}
    </button>
  );
}

// Caixa de marcar (teoria ou revisão) do edital verticalizado: muda na hora e salva em seguida
export function Marcador({ edital, disciplina, chave, campo, valor, rotulo }: {
  edital: string; disciplina: string; chave: string; campo: 'teoria' | number; valor: boolean; rotulo: string;
}) {
  const [otimista, setOtimista] = useOptimistic(valor);
  const [, iniciar] = useTransition();
  const [erro, setErro] = useState(false);
  return (
    <button type="button" role="checkbox" aria-checked={otimista} aria-label={rotulo} title={erro ? 'Não foi possível salvar. Tente de novo.' : rotulo}
      className={`${s.caixa} ${otimista ? s.caixaOk : ''} ${erro ? s.caixaErro : ''}`}
      onClick={() => iniciar(async () => {
        setErro(false);
        setOtimista(!otimista);
        const r = await marcarConteudo(edital, disciplina, chave, campo, !otimista);
        if (r.erro) setErro(true);
      })}>
      {otimista && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
    </button>
  );
}

export type OpcaoDisciplina = { nome: string; conteudos: { chave: string; nome: string }[] };

// Quadro "Registrar estudo"
export function RegistrarEstudo({ edital, editalNome, opcoes, hoje, intervalos, diasPadrao, abrirComMinutos }: {
  edital: string | null; editalNome: string; opcoes: OpcaoDisciplina[]; hoje: string; intervalos: number[]; diasPadrao: number[]; abrirComMinutos?: number | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [estado, enviar, pendente] = useActionState<Res, FormData>(registrarEstudo, {});
  const [disc, setDisc] = useState(opcoes[0]?.nome ?? '');
  const [conteudo, setConteudo] = useState('');
  const [horas, setHoras] = useState(0);
  const [mins, setMins] = useState(0);
  const [gerar, setGerar] = useState(true);

  const abrir = (d: Detalhe) => {
    if (d.conteudo) {
      const [dn] = d.conteudo.split('::');
      setDisc(dn);
      setConteudo(d.conteudo);
    }
    if (typeof d.minutos === 'number') {
      setHoras(Math.floor(d.minutos / 60));
      setMins(d.minutos % 60);
    }
    ref.current?.showModal();
  };

  useEffect(() => {
    const h = (e: Event) => abrir((e as CustomEvent<Detalhe>).detail ?? {});
    window.addEventListener(EVENTO_REGISTRAR, h);
    return () => window.removeEventListener(EVENTO_REGISTRAR, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (abrirComMinutos != null) abrir({ minutos: abrirComMinutos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirComMinutos]);

  // registrou: fecha e limpa (cada envio devolve um resultado novo)
  useEffect(() => {
    if (!estado.ok) return;
    ref.current?.close();
    formRef.current?.reset();
    setHoras(0); setMins(0); setConteudo('');
  }, [estado]);

  const lista = opcoes.find((o) => o.nome === disc)?.conteudos ?? [];
  const opcoesHoras = Array.from({ length: 13 }, (_, i) => i);
  const opcoesMin = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <dialog ref={ref} className={s.dialogo} aria-labelledby="reg-titulo" onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <form ref={formRef} action={enviar} className={s.dialogoForm}>
        <h2 id="reg-titulo" className={s.dialogoTitulo}>Registrar estudo</h2>
        <input type="hidden" name="edital" value={edital ?? ''} />
        <div className={s.fonte}><span>Fonte</span><b>{editalNome}</b></div>
        <div className={s.linhaTempo}>
          <span>Estudei</span>
          <select name="horas" aria-label="Horas" value={horas} onChange={(e) => setHoras(Number(e.target.value))}>
            {opcoesHoras.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')} horas</option>)}
          </select>
          <span>e</span>
          <select name="minutos" aria-label="Minutos" value={mins} onChange={(e) => setMins(Number(e.target.value))}>
            {[...new Set([...opcoesMin, mins])].sort((a, b) => a - b).map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')} minutos</option>)}
          </select>
          <span>em</span>
          <input type="date" name="dia" defaultValue={hoje} max={hoje} aria-label="Data" required />
        </div>
        <label className={s.campoEscuro}>
          <span>Disciplina</span>
          <select value={disc} onChange={(e) => { setDisc(e.target.value); setConteudo(''); }} required>
            {opcoes.map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
          </select>
        </label>
        <label className={s.campoEscuro}>
          <span>Assunto</span>
          <select name="conteudo" value={conteudo || `${disc}::`} onChange={(e) => setConteudo(e.target.value)}>
            <option value={`${disc}::`}>Disciplina inteira (sem assunto)</option>
            {lista.map((c) => <option key={c.chave} value={`${disc}::${c.chave}`}>{c.nome}</option>)}
          </select>
        </label>
        <label className={s.campoEscuro}>
          <span>Tipo de estudo</span>
          <select name="tipo" defaultValue="misto">
            <option value="misto">Misto</option>
            <option value="teoria">Teoria</option>
            <option value="questoes">Questões</option>
            <option value="revisao">Revisão</option>
            <option value="leitura">Leitura de lei</option>
          </select>
        </label>
        <fieldset className={s.opcoes}>
          <legend className="sr-only">Situação do assunto</legend>
          <label><input type="radio" name="situacao" value="continuar" defaultChecked /><span><b>Continuar estudando esse assunto</b><small>No próximo bloco desta disciplina, ele aparece de novo.</small></span></label>
          <label><input type="radio" name="situacao" value="finalizei" /><span><b>Finalizei toda a teoria desse assunto</b><small>Ele sai dos próximos blocos de estudo (ainda pode aparecer nas revisões).</small></span></label>
        </fieldset>
        <label className={s.marcarGerar}>
          <input type="checkbox" name="gerar" checked={gerar} onChange={(e) => setGerar(e.target.checked)} />
          <span><b>Gerar revisões</b><small>O site agenda revisões deste assunto nos intervalos marcados.</small></span>
        </label>
        {gerar && (
          <div className={s.revisoesBox}>
            <span className={s.miniRotulo}>Intervalos de revisão</span>
            <div className={s.chips}>
              {[1, 7, 14, 30, 90, 120].map((n) => (
                <label key={n}><input type="checkbox" name="intervalos" value={n} defaultChecked={intervalos.includes(n)} />{n} {n === 1 ? 'dia' : 'dias'}</label>
              ))}
            </div>
            <span className={s.miniRotulo}>Dias permitidos para revisão</span>
            <div className={s.chips}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
                <label key={d}><input type="checkbox" name="dias_rev" value={i} defaultChecked={diasPadrao.includes(i)} />{d}</label>
              ))}
            </div>
          </div>
        )}
        <label className={s.campoEscuro}>
          <span>Observações</span>
          <textarea name="observacoes" rows={3} maxLength={1000} />
        </label>
        {estado.erro && <p role="alert" className="erro" style={{ margin: 0 }}>{estado.erro}</p>}
        <div className={s.dialogoAcoes}>
          <button type="button" className={s.btnTexto} onClick={() => ref.current?.close()}>Cancelar</button>
          <button className={s.btnPrimario} disabled={pendente}>{pendente ? 'Registrando…' : 'Registrar estudo'}</button>
        </div>
      </form>
    </dialog>
  );
}
