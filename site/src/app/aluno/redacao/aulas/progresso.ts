import { AULAS_REDACAO } from '@/lib/redacaoAulas';

// Uma aula está "feita" quando o aluno já enviou a redação da semana.
// Se a mesma proposta aparece em mais de uma semana (ex.: semana 1 e a reescrita da semana 7),
// a segunda conta a partir do 2º envio.
export function semanasFeitas(propostasEnviadas: (string | null)[]): Set<number> {
  const conta = new Map<string, number>();
  for (const p of propostasEnviadas) if (p) conta.set(p, (conta.get(p) ?? 0) + 1);
  const feitas = new Set<number>();
  const vistas = new Map<string, number>();
  for (const a of AULAS_REDACAO) {
    const k = (vistas.get(a.tarefa.proposta) ?? 0) + 1;
    vistas.set(a.tarefa.proposta, k);
    if ((conta.get(a.tarefa.proposta) ?? 0) >= k) feitas.add(a.n);
  }
  return feitas;
}
