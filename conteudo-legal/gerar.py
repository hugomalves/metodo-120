# Gera src/lib/textosLegais.ts a partir de termos.md e privacidade.md (rode de novo após editar os .md)
import json, pathlib, markdown
aqui = pathlib.Path(__file__).parent
saida = ['// Gerado por conteudo-legal/gerar.py a partir dos arquivos .md — não edite à mão.']
for nome in ['termos', 'privacidade']:
    html = markdown.markdown((aqui / f'{nome}.md').read_text(encoding='utf-8'), extensions=['tables', 'sane_lists'], tab_length=4)
    saida.append(f'export const {nome.upper()}_HTML = {json.dumps(html, ensure_ascii=False)};')
(aqui.parent / 'src/lib/textosLegais.ts').write_text('\n'.join(saida) + '\n', encoding='utf-8')
print('ok')
