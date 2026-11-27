import Link from 'next/link';
import type { ItemPlano } from '@/lib/planoCurso';
import { propostaDoBloco } from '@/lib/redacao';
import { alternarFeito } from './acoes';
import s from './plano.module.css';

const duracao = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);

// Itens de um dia do plano: PDF do bloco, questões do bloco e "Concluir"
export function Lista({ itens, temPdf, podeMarcar }: { itens: (ItemPlano & { feito: boolean })[]; temPdf: Set<string>; podeMarcar?: boolean }) {
  return (
    <ul className={s.lista}>
      {itens.map((i) => (
        <li key={i.codigo} className={s.item} data-feito={i.feito || undefined} data-tipo={i.tipo}>
          <div className={s.info}>
            <span className={s.disc}>{i.tipo === 'simulado' || i.tipo === 'mini' ? i.tipo === 'mini' ? 'Minissimulado' : 'Simulado' : i.disciplina} · {duracao(i.minutos)}</span>
            <b>{i.titulo}</b>
            {i.subtitulo && <span className="suave">{i.subtitulo}</span>}
          </div>
          <div className={s.acoes}>
            {i.pdf && (temPdf.has(i.pdf)
              ? <a href={`/api/curso-pdf/${i.pdf}`} target="_blank" rel="noopener" className="btn btn-azul">Abrir PDF</a>
              : <span className={s.embreve}>PDF em breve</span>)}
            {i.caderno && <Link href={`/lista/${i.caderno}`} className="btn btn-linha">Questões</Link>}
            {propostaDoBloco(i.codigo) && <Link href={`/aluno/redacao/nova?tema=${propostaDoBloco(i.codigo)!.slug}`} className="btn btn-linha">Enviar redação</Link>}
            {i.tipo === 'revisao' && <Link href="/aluno/questoes/erros" className="btn btn-linha">Meus erros</Link>}
            {i.tipo === 'simulado' && <Link href="/aluno/simulados" className="btn btn-linha">Ir aos simulados</Link>}
            {i.tipo === 'mini' && <Link href="/aluno/minissimulados" className="btn btn-linha">Ir aos minissimulados</Link>}
            {podeMarcar && (
              <form action={alternarFeito}>
                <input type="hidden" name="codigo" value={i.codigo} />
                {i.feito && <input type="hidden" name="desfazer" value="1" />}
                <button className={i.feito ? s.feitoBtn : s.concluirBtn} aria-label={i.feito ? `Desfazer: ${i.titulo}` : `Concluir: ${i.titulo}`}>{i.feito ? '✓ Feito' : 'Concluir'}</button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
