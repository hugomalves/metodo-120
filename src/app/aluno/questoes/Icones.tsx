// Ícones do banco de questões (setas verde/azul, pasta, caderno)
export const SetaVerde = () => (
  <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><path d="M0 5h12V0l10 9-10 9v-5H0z" fill="#22b35a" /></svg>
);
export const SetaAzul = () => (
  <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><path d="M0 5h12V0l10 9-10 9v-5H0z" fill="#3b82f6" /></svg>
);
export const IconePasta = ({ aberta }: { aberta?: boolean }) => (
  <svg width="24" height="20" viewBox="0 0 24 20" aria-hidden="true">
    <path d="M1 3a2 2 0 0 1 2-2h6l2 2.5h10a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" fill={aberta ? '#f59e0b' : '#f5c451'} />
    <path d="M1 7.5h22V17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" fill={aberta ? '#fbbf24' : '#fcd979'} />
  </svg>
);
export const IconeCaderno = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 1.5h13a1.5 1.5 0 0 1 1.5 1.5v16A1.5 1.5 0 0 1 17 20.5H4A2.5 2.5 0 0 1 1.5 18V4A2.5 2.5 0 0 1 4 1.5z" /><path d="M6 1.5v19" />
  </svg>
);
