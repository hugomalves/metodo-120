// Nome, textos e pessoas da marca num lugar só (trocar aqui muda o site todo)
export const MARCA = {
  nome: 'Método 120',
  slogan: 'Estude certo. Evolua. Aprove.',
  descricao: 'Plano de estudo por edital, banco de questões por banca e simulados para carreiras policiais.',
  professor: 'Prof. Hugo M. Alves',
};

// Redes sociais no cabeçalho (deixe vazio para esconder o ícone)
export const REDES = {
  instagram: '',
  youtube: '',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? '',
};

// Quem aparece na vitrine. fotoCorpo: coloque o arquivo em public/img/ e escreva o caminho aqui.
export const EXPERT = {
  nome: 'Will Miranda',
  chamada: 'Quem vai te guiar',
  resumo: 'Aprovado em três concursos da segurança pública, Will Miranda colocou no Método 120 o que funcionou na própria preparação: estudar o que o edital cobra, treinar no estilo da banca e acompanhar a evolução todos os dias.',
  aprovacoes: ['Corpo de Bombeiros do RN', 'Guarda Municipal de Parnamirim', 'PM do Ceará'],
  fotoRosto: '/img/expert-rosto.jpg',
  fotoCorpo: null as string | null,
};

// Dados da empresa no rodapé (preencher com o CNPJ da empresa nova)
export const EMPRESA = {
  razao: '[Razão social da empresa]',
  cnpj: '[CNPJ]',
  email: '[e-mail de contato]',
};
