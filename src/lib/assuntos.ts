// Rótulos usados no banco de questões
export const NIVEIS: Record<string, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
export const ORIGENS: Record<string, string> = { prova: 'Prova oficial', autoral: 'Autoral' };
export const TIPOS: Record<string, string> = { multipla: 'Múltipla escolha', certo_errado: 'Certo ou errado' };
export const ESCOLARIDADES: Record<string, string> = { fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior' };

// Sugestões ao cadastrar (o professor pode digitar outras)
export const BANCAS = ['Instituto AOCP', 'IDIB', 'Cebraspe', 'FGV', 'FCC', 'Vunesp', 'IBFC', 'IDECAN', 'Ibade', 'Instituto Consulplan', 'Quadrix', 'Fundatec', 'Instituto Avalia', 'Cesgranrio'];

// Assunto sem disciplina não existe: a lista de sugestões vem do catálogo de assuntos do banco
export const ASSUNTOS: string[] = [];
