# Plataforma de concursos · código do site

Feito a partir do Gabarito em 15, adaptado para concursos (público adulto).

- **Next.js** (site), hospedado na **Vercel**
- **Supabase** (banco de dados, login e arquivos)

## Banco de dados (uma vez, num projeto NOVO do Supabase)
SQL Editor → New query → colar todo o `supabase/migrations/0001_concursos.sql` → **Run**.
No fim aparece a conferência: "PM PE 2026 · Soldado | 6 | 60".

## Formato do pacote de questões (`questoes.json`)
```json
{
  "prova": { "codigo": "CB-PRF-2021", "banca": "Cebraspe", "orgao": "PRF", "cargo": "Policial Rodoviário Federal",
             "ano": 2021, "escolaridade": "superior", "tipo": "certo_errado" },
  "textos_base": [ { "codigo": "CB-PRF-2021-TB1", "texto": "…", "figuras": [] } ],
  "questoes": [
    { "codigo": "CB-PRF-2021-41", "numero_prova": 41, "disciplina": "Direito Constitucional",
      "assunto": "Direitos e garantias fundamentais", "texto_base": "CB-PRF-2021-TB1",
      "enunciado": "…", "resposta": "E", "comentario": "…", "nivel": "medio" }
  ]
}
```
- Múltipla escolha: `"tipo": "multipla"`, `"alternativas": {"A": "…", …}` e `"resposta": "A"`…`"E"` (sem a E = prova de 4 alternativas).
- Certo/errado: `"resposta": "C"` ou `"E"`. Anulada: `"X"` (não entra).
- Texto: parágrafos separados por linha em branco; figura `[[fig:1]]`; matemática `$$…$$`;
  tabela em linhas `| a | b |` (a 2ª linha `|---|---|` marca o cabeçalho).

## Regras
- Só maiores de 18 anos (declaração no cadastro; o banco recusa ano de nascimento de menor).
- Gabarito nunca vai para o navegador antes da resposta.
- No certo/errado, a nota líquida segue o Cebraspe: cada erro anula um acerto; branco não conta.
- Nenhum pixel de anúncio nas áreas logadas.
