import { Marca } from '@/components/Marca';

// Barra superior das áreas logadas
export function BarraTopo({ nome, selo, inicio, conta }: { nome: string; selo?: string; inicio: string; conta?: string }) {
  return (
    <div style={{ background: 'var(--faixa)', borderBottom: '1px solid var(--linha)' }}>
      <div className="container topo" style={{ paddingBlock: 14 }}>
        <div className="linha-flex">
          <Marca href={inicio} tamanho={26} />
          {selo && (
            <span style={{ fontSize: 14, fontWeight: 600, padding: '4px 10px', borderRadius: 4, background: 'var(--azul)' }}>{selo}</span>
          )}
        </div>
        <div className="linha-flex" style={{ gap: 14 }}>
          {conta ? (
            <a href={conta} style={{ fontWeight: 600, color: 'var(--texto)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40 }} title="Minha conta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f6bff" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              {nome}
            </a>
          ) : (
            <span style={{ fontWeight: 600 }}>{nome}</span>
          )}
          <form action="/sair" method="post">
            <button className="btn btn-linha" style={{ minHeight: 40 }}>Sair</button>
          </form>
        </div>
      </div>
    </div>
  );
}
