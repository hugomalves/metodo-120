'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './semana-zero.module.css';

type Trilha = 'gabaritar' | 'ir_bem';
const ETAPAS = ['Boas-vindas', 'Trilha', 'Diagnóstico', 'Pronto'];

export function SemanaZero({ nome, turma }: { nome: string; turma: string | null }) {
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [trilha, setTrilha] = useState<Trilha>('gabaritar');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function concluir() {
    setSalvando(true); setErro('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/entrar');

    const { error } = await supabase.from('perfis').update({ trilha, onboarding_ok: true }).eq('id', user.id);
    if (error) { setSalvando(false); return setErro('Não foi possível salvar. Tente de novo em instantes.'); }

    router.push('/aluno');
    router.refresh();
  }

  const opcoes: { id: Trilha; nome: string; meta: string; desc: string }[] = [
    { id: 'gabaritar', nome: 'Gabaritar', meta: 'Meta: 45 de 45', desc: 'Todo o conteúdo, mais os módulos extras de assuntos que caem pouco.' },
    { id: 'ir_bem', nome: 'Ir bem', meta: 'Meta: 30 de 45 ou mais', desc: 'Foco em garantir as questões fáceis e médias, que pesam mais na TRI.' },
  ];
  const nomeTrilha = trilha === 'gabaritar' ? 'Gabaritar' : 'Ir bem';

  return (
    <div className={styles.pagina}>
      <ol aria-label="Etapas" className={styles.etapas}>
        {ETAPAS.map((l, i) => (
          <li key={l} aria-current={i + 1 === passo ? 'step' : undefined}>
            <span style={{ background: i + 1 <= passo ? 'var(--ciano)' : 'var(--linha)' }} />
            <small style={{ color: i + 1 <= passo ? 'var(--texto)' : 'var(--suave)', fontWeight: i + 1 === passo ? 700 : 500 }}>
              {i + 1}. {l}
            </small>
          </li>
        ))}
      </ol>

      <main className={`cartao ${styles.caixa}`}>
        {passo === 1 && (
          <>
            <h1 className="display" style={{ margin: 0, fontSize: 'clamp(28px, 3.8vw, 42px)', lineHeight: 1.08 }}>
              Boas-vindas ao Método 120{nome ? `, ${nome}` : ''}
            </h1>
            <div className={`cartao-gradiente ${styles.video}`}>
              <img src="/img/expert-rosto.jpg" alt="" width={110} height={110} />
              <span style={{ fontWeight: 700 }}>Recado de boas-vindas do Hugo · em breve</span>
            </div>
            <p style={{ margin: 0, fontSize: 17, color: 'var(--texto-2)' }}>
              {turma ? `Sua turma: ${turma}. ` : ''}A semana zero prepara você para chegar no primeiro dia sabendo o seu ponto de partida.
            </p>
            <div className={styles.tres}>
              <div><b>Escolher sua trilha</b><span>Gabaritar ou ir bem. Dá para trocar depois.</span></div>
              <div><b>Simulado diagnóstico</b><span>Para saber o que você já domina.</span></div>
              <div><b>15 minutos por dia</b><span>Uma aula curta de conteúdo novo a cada dia.</span></div>
            </div>
            <button className="btn btn-ciano btn-grande" style={{ alignSelf: 'flex-start' }} onClick={() => setPasso(2)}>Começar</button>
          </>
        )}

        {passo === 2 && (
          <>
            <h1 className="display" style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 38px)' }}>Qual é a sua meta em Matemática?</h1>
            <div className={styles.opcoes}>
              {opcoes.map((o) => (
                <button key={o.id} aria-pressed={trilha === o.id} onClick={() => setTrilha(o.id)} className={`${styles.opcao} ${trilha === o.id ? styles.opcaoAtiva : ''}`}>
                  <span className="display" style={{ fontSize: 28 }}>{o.nome}</span>
                  <span className="mono" style={{ fontSize: 14 }}>{o.meta}</span>
                  <span style={{ fontSize: 15 }}>{o.desc}</span>
                </button>
              ))}
            </div>
            <p className="suave" style={{ margin: 0, fontSize: 15 }}>
              Na dúvida, escolha a que parece mais perto da sua nota. Você pode trocar de trilha quando quiser.
            </p>
            <div className="linha-flex">
              <button className="btn btn-linha btn-grande" onClick={() => setPasso(1)}>Voltar</button>
              <button className="btn btn-ciano btn-grande" onClick={() => setPasso(3)}>Continuar</button>
            </div>
          </>
        )}

        {passo === 3 && (
          <>
            <h1 className="display" style={{ margin: 0, fontSize: 'clamp(26px, 3.4vw, 38px)' }}>Simulado diagnóstico</h1>
            <p style={{ margin: 0, fontSize: 17, color: 'var(--texto-2)' }}>
              Imprima, resolva no papel e lance as respostas no cartão digital. O resultado não entra no ranking: serve só para mostrar de onde você parte. Ele fica disponível no seu painel.
            </p>
            <div className="linha-flex">
              <button className="btn btn-linha btn-grande" onClick={() => setPasso(2)}>Voltar</button>
              <button className="btn btn-ciano btn-grande" onClick={() => setPasso(4)}>Fazer depois, pelo painel</button>
            </div>
          </>
        )}

        {passo === 4 && (
          <>
            <h1 className="display" style={{ margin: 0, fontSize: 'clamp(28px, 3.8vw, 42px)' }}>Tudo pronto</h1>
            <div className={styles.tres}>
              <div><small className="rotulo">Sua trilha</small><b className="display" style={{ fontSize: 22 }}>{nomeTrilha}</b></div>
              <div><small className="rotulo">Sua turma</small><b className="display" style={{ fontSize: 22 }}>{turma ?? 'A definir na compra'}</b></div>
              <div><small className="rotulo">Diagnóstico</small><b className="display" style={{ fontSize: 22 }}>Pendente</b></div>
            </div>
            <button className="btn btn-ciano btn-grande" style={{ alignSelf: 'flex-start' }} disabled={salvando} onClick={concluir}>
              {salvando ? 'Salvando…' : 'Ir para o meu painel'}
            </button>
            {erro && <p role="alert" className="erro" style={{ margin: 0 }}>{erro}</p>}
          </>
        )}
      </main>
    </div>
  );
}
