import { redirect } from 'next/navigation';
import { areaDe } from '@/lib/sessao';
import { acessoAtual } from '@/lib/acesso';
import { Painel, type ItemPainel } from '@/components/Painel';

const ITENS: ItemPainel[] = [
  { href: '/aluno', rotulo: 'Início', icone: 'inicio', exato: true },
  { href: '/aluno/cursos', rotulo: 'Cursos em PDF', icone: 'aulas', tambem: ['/aluno/trilha', '/aluno/modulo', '/aluno/aula'] },
  { href: '/aluno/simulados', rotulo: 'Simulados', icone: 'simulados', tambem: ['/aluno/provas'] },
  { href: '/aluno/minissimulados', rotulo: 'Minissimulados', icone: 'mini', tambem: ['/aluno/simulado/'] },
  { href: '/aluno/questoes', rotulo: 'Questões', icone: 'questoes', exceto: ['/aluno/questoes/listas', '/aluno/questoes/lista'] },
  { href: '/aluno/questoes/listas', rotulo: 'Listas impressas', icone: 'listas', tambem: ['/aluno/questoes/lista'] },
  { href: '/aluno/mentoria', rotulo: 'Mentoria individual', icone: 'conta' },
  { href: '/aluno/estatisticas', rotulo: 'Estatísticas', icone: 'estatisticas' },
  { href: '/aluno/duvidas', rotulo: 'Minhas dúvidas', icone: 'duvidas' },
];

const ITENS_BANCO: ItemPainel[] = ITENS.filter((i) => !['/aluno/estatisticas', '/aluno/duvidas'].includes(i.href));

const RODAPE: ItemPainel[] = [{ href: '/aluno/conta', rotulo: 'Minha conta', icone: 'conta' }];

export default async function LayoutAluno({ children }: { children: React.ReactNode }) {
  const { perfil, acesso } = await acessoAtual();
  if (perfil.papel !== 'aluno') redirect(areaDe(perfil));

  return (
    <Painel itens={acesso.curso ? ITENS : ITENS_BANCO} rodape={RODAPE} selo={acesso.curso ? undefined : acesso.completo ? 'Banco completo' : 'Plano grátis'} inicio="/aluno" nome={perfil.nome || 'Aluno'} contaHref="/aluno/conta">
      {children}
    </Painel>
  );
}
