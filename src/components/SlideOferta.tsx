import Link from 'next/link';
import styles from '@/app/home.module.css';

// Slide de oferta (mesmo tamanho e desenho do slide do expert): texto à esquerda, foto à direita (sem foto, mostra "em breve")
export function SlideOferta({ selo, titulo, preco, beneficios, href, botao, imagem, emBreve }: {
  selo: string; titulo: string; preco: string | null; beneficios: string[]; href: string | null; botao: string; imagem: string | null; emBreve?: boolean;
}) {
  return (
    <div className={styles.heroDentro}>
      <div>
        <div className={styles.etiquetas}><span>//Oferta</span><span>{selo}</span></div>
        <h2 className={`display ${styles.heroTitulo}`} style={{ fontSize: 'clamp(34px, 5.6vw, 68px)', color: emBreve ? '#8b93a3' : '#fff' }}>{titulo}</h2>
        {preco && <p className={`${styles.heroForte} ${styles.acento}`} style={{ fontSize: 'clamp(28px, 3.6vw, 44px)' }}>{preco}</p>}
        {beneficios.length > 0 && (
          <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, color: '#d6d9e0', fontSize: 'clamp(15px, 1.5vw, 18px)' }}>
            {beneficios.slice(0, 5).map((b) => <li key={b}><b style={{ color: 'var(--vermelho-vivo)', marginRight: 8 }}>✓</b>{b}</li>)}
          </ul>
        )}
        <div className={styles.heroAcoes}>
          {href && !emBreve
            ? <Link href={href} className="btn-claro grande"><span>{botao}</span><i>→</i></Link>
            : <span className={styles.linkSimples} style={{ opacity: 0.6 }}>{botao}</span>}
        </div>
      </div>
      <div className={styles.painelFoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imagem ? <img src={imagem} alt={titulo} width={900} height={1100} /> : (
          <span style={{ position: 'absolute', zIndex: 2, inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6D9BFF' }}>{emBreve ? 'Em breve' : 'Foto em breve'}</span>
        )}
      </div>
    </div>
  );
}
