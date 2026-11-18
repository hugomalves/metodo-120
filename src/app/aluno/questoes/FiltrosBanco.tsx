'use client';

import { useMemo, useState } from 'react';
import { contar, mapaEditais, mudar, VAZIO, type Chave, type EditalFiltro, type Grupo, type ValoresFiltro } from '@/lib/filtros';
import { CamposFiltro, EtiquetasFiltro } from './CamposFiltro';
import s from '../aluno.module.css';

// Filtros do banco (formulário GET). O que o aluno escolhe aqui é um filtro em construção:
// só vale quando ele clica em "Filtrar". Escolher um edital já escolhe a banca dele (e dá para trocar depois).
export function FiltrosBanco({ grupos, editais, inicial, situacao = '', pp }: {
  grupos: Grupo[]; editais: EditalFiltro[]; inicial: Partial<ValoresFiltro>; situacao?: string; pp?: string;
}) {
  const mapa = useMemo(() => mapaEditais(editais), [editais]);
  const [f, setF] = useState<ValoresFiltro>({ ...VAZIO, ...Object.fromEntries(Object.entries(inicial).filter(([, v]) => v)) });
  const [sit, setSit] = useState(situacao);
  const n = contar(grupos, f, mapa);
  const muda = (k: Chave, v: string) => setF((x) => mudar(x, k, v, mapa, { editais, grupos }));

  return (
    <form method="get" className={s.filtrosForm} aria-label="Filtros">
      {pp && <input type="hidden" name="pp" value={pp} />}
      <div className={s.filtrosAluno}>
        <CamposFiltro grupos={grupos} editais={editais} mapa={mapa} f={f} muda={muda} prefixo="fb" />
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
      <EtiquetasFiltro f={f} muda={muda} editais={editais} />
      <div className={s.filtrosRodape}>
        <a href="/aluno/questoes?todos=1" className={s.filtrosLimpar}>Limpar filtros</a>
        <span className={s.filtrosDica}>Os filtros só valem depois de clicar em Filtrar.</span>
        <button className="btn btn-azul">Filtrar · {n} {n === 1 ? 'questão' : 'questões'}</button>
      </div>
    </form>
  );
}
