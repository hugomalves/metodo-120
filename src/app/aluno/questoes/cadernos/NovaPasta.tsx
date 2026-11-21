'use client';

import { Formulario } from '@/components/Formulario';
import { criarPasta } from '../acoes';

export function NovaPasta({ pai }: { pai: string | null }) {
  return (
    <details style={{ flex: '1 1 260px' }}>
      <summary className="btn btn-linha" style={{ display: 'inline-flex', cursor: 'pointer', background: '#e8a33d', borderColor: '#e8a33d', color: '#1b1200', fontWeight: 800 }}>NOVA PASTA</summary>
      <div style={{ marginTop: 10, maxWidth: 420 }}>
        <Formulario acao={criarPasta} botao="Criar pasta" pendenteTexto="Criando…" limparAoEnviar>
          {pai && <input type="hidden" name="pai" value={pai} />}
          <div className="campo">
            <label htmlFor="nome-pasta">{pai ? 'Nome da pasta (dentro desta)' : 'Nome da pasta'}</label>
            <input id="nome-pasta" name="nome" maxLength={80} placeholder="Ex.: Direito Constitucional" required />
          </div>
        </Formulario>
      </div>
    </details>
  );
}
