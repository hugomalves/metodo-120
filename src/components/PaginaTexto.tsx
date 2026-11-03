import { Marca } from '@/components/Marca';

export function PaginaTexto({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <header className="topo"><Marca /></header>
      <main style={{ paddingBottom: 64, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 40px)' }}>{titulo}</h1>
        {children}
      </main>
    </div>
  );
}
