'use client';

import { useRouter } from 'next/navigation';

const OPCOES = [1, 5, 10];

// "Questões por página": guarda a escolha num cookie e mantém o aluno perto da questão em que estava
export function SeletorPorPagina({ base, pagina, porPagina }: { base: string; pagina: number; porPagina: number }) {
  const router = useRouter();
  function mudar(novo: number) {
    try { document.cookie = `gq_pp=${novo}; path=/; max-age=31536000; samesite=lax`; } catch { /* sem cookie, segue pela URL */ }
    const primeira = (pagina - 1) * porPagina; // índice da primeira questão visível
    const [caminho, q] = base.split('?');
    const p = new URLSearchParams(q ?? '');
    p.set('pp', String(novo));
    p.set('p', String(Math.floor(primeira / novo) + 1));
    router.push(`${caminho}?${p.toString()}`);
  }
  return (
    <label className="q-pp">
      <span>Por página</span>
      <select value={porPagina} onChange={(e) => mudar(parseInt(e.target.value, 10))} aria-label="Questões por página">
        {OPCOES.map((n) => <option key={n} value={n}>{n} {n === 1 ? 'questão' : 'questões'}</option>)}
      </select>
    </label>
  );
}
