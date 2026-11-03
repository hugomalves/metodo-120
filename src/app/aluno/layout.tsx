import { redirect } from 'next/navigation';
import { areaDe } from '@/lib/sessao';
import { acessoAtual } from '@/lib/acesso';
import { Painel, type ItemPainel } from '@/components/Painel';

const ITENS: ItemPainel[] = [
  { href: '/aluno', rotulo: 'Início', icone: 'inicio', exato: true },
  { href: '/aluno/trilha', rotulo: 'Aulas', icone: 'aulas', tambem: ['/aluno/modulo', '/aluno/aula'] },
  { href: '/aluno/questoes', rotulo: 'Questões', icone: 'questoes', exceto: ['/aluno/questoes/listas', '/aluno/questoes/lista'] },
  { href: '/aluno/questoes/listas', rotulo: 'Listas sob medida', icone: 'listas', tambem: ['/aluno/questoes/lista'] },
  { href: '/aluno/provas', rotulo: 'Simulados', icone: 'simulados', tambem: ['/aluno/simulado/', '/aluno/simulados'] },
  { href: '/aluno/estatisticas', rotulo: 'Estatísticas', icone: 'estatisticas' },
  { href: '/aluno/duvidas', rotulo: 'Minhas dúvidas', icone: 'duvidas' },
];
// plano grátis ou banco completo (sem o curso): só o banco de questões
const ITENS_BANCO: ItemPainel[] = [
  { href: '/aluno', rotulo: 'Início', icone: 'inicio', exato: true },
  { href: '/aluno/questoes', rotulo: 'Questões', icone: 'questoes', exceto: ['/aluno/questoes/listas', '/aluno/questoes/lista'] },
  { href: '/aluno/questoes/listas', rotulo: 'Listas sob medida', icone: 'listas', tambem: ['/aluno/questoes/lista'] },
  { href: '/aluno/provas', rotulo: 'Simulados', icone: 'simulados' },
  { href: '/aluno/planos', rotulo: 'Planos', icone: 'banco' },
];
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
