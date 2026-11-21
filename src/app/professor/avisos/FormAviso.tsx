'use client';

import { Formulario } from '@/components/Formulario';
import { salvarAviso } from './acoes';

export function FormAviso() {
  return (
    <Formulario acao={salvarAviso} botao="Publicar aviso" pendenteTexto="Salvando…" limparAoEnviar>
      <div className="campo"><label htmlFor="av-t">Título (aparece grande, no quadro azul)</label><input id="av-t" name="titulo" maxLength={90} required placeholder="Ex.: Novo simulado da PM PE no ar" /></div>
      <div className="campo"><label htmlFor="av-x">Texto (opcional)</label><textarea id="av-x" name="texto" maxLength={300} rows={2} placeholder="Uma frase curta explicando." /></div>
      <div className="campo"><label htmlFor="av-l">Link do botão (opcional)</label><input id="av-l" name="link_url" placeholder="https://… ou /aluno/simulados" /></div>
      <div className="campo"><label htmlFor="av-lt">Texto do botão (opcional)</label><input id="av-lt" name="link_texto" maxLength={40} placeholder="Ex.: Fazer agora" /></div>
      <div className="campo"><label htmlFor="av-o">Ordem (0 aparece primeiro)</label><input id="av-o" name="ordem" type="number" defaultValue={0} /></div>
    </Formulario>
  );
}
