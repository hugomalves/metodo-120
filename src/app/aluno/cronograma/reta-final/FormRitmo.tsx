import { FormAcao } from '@/app/professor/FormAcao';
import { dataCurta, dataLonga } from '@/lib/cronograma';
import { DATA_PROVA, OPCOES_TEMPO, fimCom, rotuloTempo, type ConfigPlano, type ItemPlano } from '@/lib/planoCurso';
import { salvarPlano } from './acoes';
import s from './plano.module.css';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Dia de começar, horas por dia e dias da semana (cria ou ajusta o cronograma personalizado)
export function FormRitmo({ itens, feitos, cfg, hoje }: { itens: ItemPlano[]; feitos: Map<string, string>; cfg: ConfigPlano | null; hoje: string }) {
  const base: ConfigPlano = cfg ?? { inicio: hoje, minutos_dia: 120, dias_semana: [0, 1, 2, 3, 4, 5, 6] };
  const previsoes = OPCOES_TEMPO.map((m) => ({ m, fim: fimCom(itens, feitos, base, hoje, m) }));
  return (
    <FormAcao acao={salvarPlano} botao={cfg ? 'Salvar e refazer meu cronograma' : 'Iniciar meu cronograma'}>
      <div className={s.grade}>
        <div className="campo">
          <label htmlFor="pl-ini">Quando você quer começar?</label>
          <input id="pl-ini" type="date" name="inicio" defaultValue={base.inicio < hoje ? hoje : base.inicio} min={hoje} />
        </div>
        <div className="campo">
          <label htmlFor="pl-min">Quantas horas por dia?</label>
          <select id="pl-min" name="minutos" defaultValue={base.minutos_dia}>
            {previsoes.map(({ m, fim }) => (
              <option key={m} value={m}>{rotuloTempo(m)} por dia{m === 120 ? ' (padrão)' : ''}{fim ? ` · termina ${dataCurta(fim)}` : ''}</option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className={s.dias}>
        <legend>Dias de estudo</legend>
        {SEMANA.map((d, i) => (
          <label key={d}><input type="checkbox" name="dias" value={i} defaultChecked={base.dias_semana.includes(i)} />{d}</label>
        ))}
      </fieldset>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--texto-2)' }}>Prova prevista para {dataLonga(DATA_PROVA)}. Os simulados ocupam um dia inteiro (4h30). Você pode mudar o dia e as horas quando quiser, sem perder o que já fez.</p>
    </FormAcao>
  );
}
