import Link from 'next/link';
import { Formulario } from '@/components/Formulario';
import { enviarDuvida } from './actions';

// Caixa para mandar uma dúvida direto ao professor (não aparece para os outros alunos)
export function CaixaDuvida({ aulaId, contexto, titulo, aberta = false }: { aulaId?: string; contexto?: string; titulo: string; aberta?: boolean }) {
  return (
    <details className="cartao" open={aberta} style={{ padding: '14px 18px', borderRadius: 4 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f6bff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v11H9l-5 4z M10 9.3a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.4 M12 14.3v.2" />
        </svg>
        {titulo}
      </summary>
      <div style={{ paddingTop: 12 }}>
        <Formulario acao={enviarDuvida} botao="Enviar ao professor" limparAoEnviar>
          {aulaId && <input type="hidden" name="aula_id" value={aulaId} />}
          {contexto && <input type="hidden" name="contexto" value={contexto} />}
          <div className="campo">
            <label htmlFor={`duv-${aulaId ?? contexto ?? 'geral'}`}>Sua dúvida</label>
            <textarea id={`duv-${aulaId ?? contexto ?? 'geral'}`} name="texto" rows={4} minLength={5} maxLength={2000} required
              placeholder="Conte o que não ficou claro. Se for de uma conta, diga em que passo travou." />
          </div>
          <p className="suave" style={{ margin: 0, fontSize: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 2 }}>
              <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span>Sua dúvida não fica registrada para todos: apenas o professor vê e responde. A resposta aparece em <Link href="/aluno/duvidas">Minhas dúvidas</Link>.</span>
          </p>
        </Formulario>
      </div>
    </details>
  );
}
