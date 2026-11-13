'use client';

import { useMemo, useState } from 'react';
import { contar, mapaEditais, mudar, VAZIO, type EditalFiltro, type Grupo, type ValoresFiltro } from '@/lib/filtros';
import { CamposFiltro } from './CamposFiltro';
import s from '../aluno.module.css';

// Filtros do banco (formulário GET): as opções de cada campo dependem do que já foi escolhido
export function FiltrosBanco({ grupos, editais, inicial, situacao = '', pp }: {
  grupos: Grupo[]; editais: EditalFiltro[]; inicial: Partial<ValoresFiltro>; situacao?: string; pp?: string;
}) {
  const mapa = useMemo(() => mapaEditais(editais), [editais]);
  const [f, setF] = useState<ValoresFiltro>({ ...VAZIO, ...Object.fromEntries(Object.entries(inicial).filter(([, v]) => v)) });
  const [sit, setSit] = useState(situacao);
  const n = contar(grupos, f, mapa);

  return (
    <form method="get" className={s.filtrosForm} aria-label="Filtros">
      {pp && <input type="hidden" name="pp" value={pp} />}
      <div className={s.filtrosAluno}>
        <CamposFiltro grupos={grupos} editais={editais} mapa={mapa} f={f} muda={(k, v) => setF((x) => mudar(x, k, v, mapa))} prefixo="fb" />
        <div className="campo">
          <label htmlFor="fbs">Situação</label>
          <select id="fbs" name="s" value={sit} onChange={(e) => setSit(e.target.value)}>
            <option value="">Todas</option>
            <option value="nao_feitas">Ainda não fiz</option>
            <option value="erradas">Errei</option>
            <option value="acertadas">Acertei</option>
          </select>
        </div>
      </div>
      <div className={s.filtrosRodape}>
        <a href="/aluno/questoes?todos=1" className={s.filtrosLimpar}>Limpar filtros</a>
        <button className="btn btn-azul">Ver {n} {n === 1 ? 'questão' : 'questões'}</button>
      </div>
    </form>
  );
}
