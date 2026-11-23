import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Caderno de questões', robots: { index: false } };

// Link/QR que está nos PDFs do curso: /lista/PT-AULA01 (aula) ou /lista/PT-AULA01-B2 (bloco).
// Entra, cria a cópia do aluno (na pasta "Reta Final PM PE") e abre o caderno.
export default async function AbrirCaderno({ params }: { params: Promise<{ codigo: string }> }) {
  const cod = decodeURIComponent((await params).codigo).toUpperCase();
  if (!/^[A-Z]{2}-AULA\d{2}(-B\d+)?$/.test(cod)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?voltar=${encodeURIComponent(`/lista/${cod}`)}`);

  const { data, error } = await supabase.rpc('abrir_caderno_modelo', { p_codigo: cod });
  if (data) redirect(`/aluno/questoes/lista/${data}`);

  const motivo = error?.message ?? '';
  const sem = motivo.includes('ACESSO');
  const ainda = motivo.includes('SEM_QUESTOES');
  const naoAchei = motivo.includes('NAO_ACHEI');
  return (
    <main className="tema-site" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="cartao" style={{ maxWidth: 520, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="rotulo">Caderno {cod}</span>
        <h1 className="display" style={{ margin: 0, fontSize: 26 }}>
          {sem ? 'Este caderno é do curso Reta Final PM PE' : ainda ? 'Estamos preparando as questões' : naoAchei ? 'Não encontramos este caderno' : 'Não foi possível abrir agora'}
        </h1>
        <p className="suave" style={{ margin: 0 }}>
          {sem && 'Ele é liberado para quem tem o curso. Se você já comprou, entre com o mesmo e-mail da compra.'}
          {ainda && 'As questões deste caderno ainda estão sendo colocadas no banco. Tente de novo em algumas horas.'}
          {naoAchei && 'Confira o link do PDF. Se o problema continuar, fale com o professor.'}
          {!sem && !ainda && !naoAchei && 'Tente de novo em instantes.'}
        </p>
        <div className="linha-flex" style={{ gap: 10 }}>
          {sem && <Link href="/curso/reta-final-pmpe" className="btn btn-azul">Ver o curso</Link>}
          <Link href="/aluno/questoes/cadernos" className="btn btn-linha">Meus cadernos</Link>
        </div>
      </div>
    </main>
  );
}
