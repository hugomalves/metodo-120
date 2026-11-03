'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Marca } from '@/components/Marca';

// Ícones de traço simples (24×24)
const ICONES: Record<string, string> = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  aulas: 'M4 5h16v11H4zM8 20h8M12 16v4M10 8.5v4l3.5-2z',
  questoes: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  listas: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  simulados: 'M7 3h10v4H7zM5 7h14v14H5zM9 12l2 2 4-4',
  mini: 'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  habilidades: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z',
  estatisticas: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  duvidas: 'M4 5h16v11H9l-5 4zM12 8.5a1.6 1.6 0 1 1 1.6 1.6c-.9 0-1.6.6-1.6 1.4M12 13.5h.01',
  conta: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  turmas: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M14 20a6 6 0 0 1 8-5.6',
  alerta: 'M12 3l10 17H2zM12 10v4M12 17h.01',
  banco: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  sair: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
};

export type ItemPainel = {
  href: string;
  rotulo: string;
  icone: keyof typeof ICONES;
  exato?: boolean;          // ativo só na rota exata
  tambem?: string[];        // outras rotas que acendem este item
  exceto?: string[];        // rotas que NÃO acendem este item
  contador?: number;
  padrao?: boolean;        // ativo também quando o parâmetro da busca não está na URL
};

function Icone({ nome }: { nome: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONES[nome] ?? ''} />
    </svg>
  );
}

function ativoPara(item: ItemPainel, rota: string, busca: URLSearchParams | null) {
  const [base, query] = item.href.split('?');
  if (item.exceto?.some((e) => rota.startsWith(e))) return false;
  if (item.tambem?.some((t) => rota.startsWith(t))) return true;
  const casaRota = item.exato ? rota === base : rota === base || rota.startsWith(base + '/');
  if (!casaRota) return false;
  if (!query || !busca) return !query;
  for (const [k, v] of new URLSearchParams(query)) {
    const atual = busca.get(k);
    if (atual === null ? !item.padrao : atual !== v) return false;
  }
  return true;
}

function Lista({ itens, aoNavegar, rota, busca }: { itens: ItemPainel[]; aoNavegar: () => void; rota: string; busca: URLSearchParams | null }) {
  return (
    <>
      {itens.map((i) => {
        const ativo = ativoPara(i, rota, busca);
        return (
          <Link key={i.href} href={i.href} onClick={aoNavegar} className="painel-item" aria-current={ativo ? 'page' : undefined}>
            <Icone nome={i.icone} />
            <span style={{ flex: 1 }}>{i.rotulo}</span>
            {!!i.contador && i.contador > 0 && <span className="bolinha" aria-label={`${i.contador} pendentes`}>{i.contador}</span>}
          </Link>
        );
      })}
    </>
  );
}

function ItensSemBusca(props: { itens: ItemPainel[]; aoNavegar: () => void }) {
  return <Lista {...props} rota={usePathname()} busca={null} />;
}

function ItensComBusca(props: { itens: ItemPainel[]; aoNavegar: () => void }) {
  const rota = usePathname();
  const busca = useSearchParams();
  return <Lista {...props} rota={rota} busca={new URLSearchParams(busca.toString())} />;
}

export function Painel({ itens, rodape, inicio, nome, contaHref, selo, children }: {
  itens: ItemPainel[]; rodape?: ItemPainel[]; inicio: string; nome: string; contaHref?: string; selo?: string; children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const rota = usePathname();
  useEffect(() => setAberto(false), [rota]);
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto]);
  const fechar = () => setAberto(false);

  return (
    <div className="painel" data-aberto={aberto ? 'sim' : 'nao'}>
      <aside className="painel-lateral" id="menu-lateral" aria-label="Menu principal">
        <div className="painel-marca">
          <Marca href={inicio} tamanho={26} />
          {selo && <span className="painel-selo">{selo}</span>}
        </div>
        <nav className="painel-nav">
          <Suspense fallback={<ItensSemBusca itens={itens} aoNavegar={fechar} />}>
            <ItensComBusca itens={itens} aoNavegar={fechar} />
          </Suspense>
        </nav>
        <div className="painel-rodape">
          {rodape && (
            <Suspense fallback={<ItensSemBusca itens={rodape} aoNavegar={fechar} />}>
              <ItensComBusca itens={rodape} aoNavegar={fechar} />
            </Suspense>
          )}
          <form action="/sair" method="post">
            <button className="painel-item painel-sair"><Icone nome="sair" /><span>Sair</span></button>
          </form>
        </div>
      </aside>
      <button className="painel-fundo" aria-label="Fechar menu" tabIndex={aberto ? 0 : -1} onClick={fechar} />

      <div className="painel-corpo">
        <header className="painel-topo">
          <button className="painel-hamburguer" aria-label="Abrir menu" aria-controls="menu-lateral" aria-expanded={aberto} onClick={() => setAberto(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <span className="painel-topo-marca"><Marca href={inicio} tamanho={26} /></span>
          {contaHref ? (
            <Link href={contaHref} className="painel-usuario" title="Minha conta">
              <span className="painel-avatar" aria-hidden="true">{(nome.trim()[0] || '?').toUpperCase()}</span>
              <span className="painel-nome">{nome}</span>
            </Link>
          ) : (
            <span className="painel-usuario">
              <span className="painel-avatar" aria-hidden="true">{(nome.trim()[0] || '?').toUpperCase()}</span>
              <span className="painel-nome">{nome}</span>
            </span>
          )}
        </header>
        <main className="painel-conteudo">{children}</main>
      </div>
    </div>
  );
}
