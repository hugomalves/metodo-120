// Planos de assinatura (página /planos): preço fechado para 1 ano, em até 12x.
// O texto fica aqui; os botões usam os produtos cadastrados em Produtos e loja (o endereço vem do nome):
//  · Básico: um produto por extensivo, "Plano Básico · Extensivo PRF", "Plano Básico · Carreiras Policiais"…
//    (endereço plano-basico-…; tipo Banco de questões; "libera o PDF de qual extensivo" = o extensivo; 365 dias de acesso)
//  · Até a prova: um produto por concurso, "Plano Até a Prova · PM PE" (plano-ate-a-prova-…; tipo Curso; edital do concurso; 365 dias)
//  · Todos os cursos: "Plano Todos os Cursos" (plano-todos-os-cursos; tipo Curso; sem edital; 365 dias)
// Item com emBreve: true aparece marcado "em breve" (ainda não existe no site).
export type ItemPlano = { texto: string; emBreve?: boolean };
export type Plano = {
  chave: 'basico' | 'ate-a-prova' | 'todos';
  slug: string;           // endereço do produto (ou o começo dele, quando há um produto por escolha)
  nome: string;
  parcela: string;        // valor de cada parcela
  parcelas: number;
  resumo: string;
  itens: ItemPlano[];
  destaque?: boolean;
  selo?: string;
  escolha?: string;       // o aluno escolhe entre vários produtos (um por extensivo ou por concurso)
};

export const PLANOS: Plano[] = [
  {
    chave: 'basico', slug: 'plano-basico', nome: 'Básico', parcela: '29,90', parcelas: 12, escolha: 'Escolha o extensivo',
    resumo: 'Extensivo para carreiras policiais: escolha o extensivo de uma carreira ou o Extensivo Geral, que cobre todas as policiais sem ser específico.',
    itens: [
      { texto: 'Extensivo de 1 carreira ou o Extensivo Geral Carreiras Policiais' },
      { texto: 'Acesso ilimitado aos PDFs do extensivo e às questões' },
      { texto: 'Cronograma de estudos com revisões automáticas' },
      { texto: '60% de desconto no plano Até a prova quando o edital da sua carreira sair' },
      { texto: '1 ano de acesso' },
    ],
  },
  {
    chave: 'ate-a-prova', slug: 'plano-ate-a-prova', nome: 'Até a prova', parcela: '39,90', parcelas: 12, escolha: 'Escolha o concurso',
    resumo: 'Escolha um concurso com edital e tenha tudo dele por 1 ano, até o dia da prova.',
    itens: [
      { texto: 'O curso completo do concurso escolhido' },
      { texto: 'Simulados no padrão da banca do seu concurso' },
      { texto: 'Minissimulados, PDFs e banco de questões' },
      { texto: 'Cronograma do edital até o dia da prova' },
      { texto: '1 ano de acesso' },
    ],
  },
  {
    chave: 'todos', slug: 'plano-todos-os-cursos', nome: 'Todos os cursos', parcela: '59,90', parcelas: 12, destaque: true, selo: 'Mais completo',
    resumo: 'Todos os cursos policiais do Método 120 em um plano só, por 1 ano.',
    itens: [
      { texto: 'Todos os cursos' },
      { texto: 'Banco de questões' },
      { texto: 'Simulados do concurso que você deseja (carreiras policiais)' },
      { texto: 'Minissimulados' },
      { texto: 'PDFs completos' },
      { texto: 'Questões em lista de PDF' },
      { texto: '1 ano de acesso' },
      { texto: 'Mentoria coletiva', emBreve: true },
      { texto: 'Mentalidade de prova', emBreve: true },
      { texto: 'Bizus de prova', emBreve: true },
      { texto: 'Flashcards', emBreve: true },
      { texto: 'Mapas mentais', emBreve: true },
    ],
  },
];

// valor total em reais (ex.: 12 × 59,90 = 718,80)
export function totalPlano(p: Plano): string {
  const v = Number(p.parcela.replace('.', '').replace(',', '.')) * p.parcelas;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// produtos de plano não aparecem como cursos soltos na loja
export const ehPlano = (slug: string) => slug.startsWith('plano-');
