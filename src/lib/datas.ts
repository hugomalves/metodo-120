// Datas no fuso de Brasília, no formato AAAA-MM-DD
export function hojeSP(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export function somarDias(dia: string, n: number): string {
  const d = new Date(dia + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// segunda-feira da semana de "dia" (0 = segunda … 6 = domingo)
export function diaDaSemana(dia: string): number {
  return (new Date(dia + 'T12:00:00Z').getUTCDay() + 6) % 7;
}

export function inicioDaSemana(dia: string): string {
  return somarDias(dia, -diaDaSemana(dia));
}

// dias corridos de hoje (Brasília) até a data
export function diasAte(dia: string): number {
  return Math.round((new Date(dia + 'T12:00:00Z').getTime() - new Date(hojeSP() + 'T12:00:00Z').getTime()) / 86400000);
}
