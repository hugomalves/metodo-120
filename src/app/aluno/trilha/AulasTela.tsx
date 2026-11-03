import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import type { ModuloT, Trilha } from '@/lib/conteudo';
import { CartaoCapa, BarraProgresso } from '@/components/CartaoCapa';
import { iconePorDisciplina } from '@/components/Capa';
import { doisDigitos } from '@/lib/capas';
import s from '../aluno.module.css';

// Aulas por disciplina; as do edital do aluno primeiro, na ordem da prova
export function AulasTela({ trilha, eds, capas }: { trilha: Trilha; eds: { disciplina: string }[]; capas: Map<string, string> }) {
  const doEdital = eds.map((d) => d.disciplina);
  const pct = trilha.total ? Math.round((100 * trilha.concluidas) / trilha.total) : 0;

  const grupos = new Map<string, ModuloT[]>();
  trilha.modulos.forEach((m) => { const k = m.disciplina ?? 'Outras aulas'; grupos.set(k, [...(grupos.get(k) ?? []), m]); });
  const ordem = [...doEdital.filter((d) => grupos.has(d)), ...Array.from(grupos.keys()).filter((d) => !doEdital.includes(d)).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  const semAulas = doEdital.filter((d) => !grupos.has(d));

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Aulas' }]} />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Aulas</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          As aulas estão organizadas por disciplina, e o plano de hoje indica qual assistir. Tudo fica aberto: você pode estudar na ordem que quiser.
          {trilha.total ? ` Você já concluiu ${trilha.concluidas} de ${trilha.total} aulas (${pct}%).` : ''}
        </p>
      </div>

      {trilha.modulos.length === 0 && <p className="suave">As aulas serão publicadas em breve.</p>}

      {ordem.map((disc) => {
        const mods = grupos.get(disc)!;
        const feitas = mods.reduce((t, m) => t + m.aulas.filter((a) => a.concluida).length, 0);
        const total = mods.reduce((t, m) => t + m.aulas.length, 0);
        return (
          <section key={disc} className={s.grupo} aria-label={disc}>
            <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="display">{disc}{doEdital.includes(disc) ? '' : <span className="suave" style={{ fontSize: 14, fontWeight: 500 }}> · fora do seu edital</span>}</h2>
              <span className="suave" style={{ fontSize: 14 }}>{feitas} de {total} aulas</span>
            </div>
            <div className="cc-grade">
              {mods.map((m) => {
                const f = m.aulas.filter((a) => a.concluida).length;
                const n = m.aulas.length;
                const min = m.aulas.reduce((t, a) => t + a.duracao_min, 0);
                const situacao = n === 0 ? 'Em breve' : f === n ? 'Concluído' : f > 0 ? 'Em andamento' : undefined;
                return (
                  <CartaoCapa key={m.id} href={n ? `/aluno/modulo/${m.id}` : undefined} imagem={m.capa_path ? capas.get(m.capa_path) : null}
                    tipo="modulo" rotulo={`Módulo ${doisDigitos(m.numero)}`} destaque={doisDigitos(m.numero)} icone={iconePorDisciplina(disc)}
                    titulo={m.titulo} selo={situacao}
                    texto={n ? `${n} aula${n > 1 ? 's' : ''} · cerca de ${min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : `${min} min`}` : 'As aulas deste módulo saem em breve.'}
                    rodape={n ? <span className="cc-info">{f} de {n} concluídas</span> : undefined}>
                    {n > 0 && <BarraProgresso pct={Math.round((100 * f) / n)} rotulo={`${f} de ${n} aulas concluídas`} />}
                  </CartaoCapa>
                );
              })}
            </div>
          </section>
        );
      })}

      {semAulas.length > 0 && trilha.modulos.length > 0 && (
        <p className="suave" style={{ margin: 0 }}>Ainda sem aulas publicadas: {semAulas.join(', ')}. Enquanto isso, o plano de hoje indica resumo e questões.</p>
      )}
    </>
  );
}
