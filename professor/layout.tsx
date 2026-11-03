import { redirect } from 'next/navigation';
import { exigirLogin, areaDe } from '@/lib/sessao';
import { Painel, type ItemPainel } from '@/components/Painel';

export default async function LayoutProfessor({ children }: { children: React.ReactNode }) {
  const { supabase, perfil } = await exigirLogin();
  if (perfil.papel !== 'professor') redirect(areaDe(perfil));
  const { count } = await supabase.from('duvidas').select('id', { count: 'exact', head: true }).in('status', ['pendente', 'nao_compreendida']);

  const itens: ItemPainel[] = [
    { href: '/professor', rotulo: 'Visão geral', icone: 'inicio', exato: true },
    { href: '/professor/duvidas', rotulo: 'Plantão de dúvidas', icone: 'duvidas', contador: count ?? 0 },
    { href: '/professor/editais', rotulo: 'Editais', icone: 'habilidades' },
    { href: '/professor/aulas', rotulo: 'Aulas', icone: 'aulas' },
    { href: '/professor/simulados', rotulo: 'Simulados e gabaritos', icone: 'simulados' },
    { href: '/professor/banco', rotulo: 'Banco de questões', icone: 'banco' },
    { href: '/professor/questoes-criticas', rotulo: 'Questões que mais derrubam', icone: 'alerta' },
    { href: '/professor/engajamento', rotulo: 'Engajamento', icone: 'estatisticas' },
    { href: '/professor/alunos', rotulo: 'Alunos', icone: 'conta' },
    { href: '/professor/turmas', rotulo: 'Turmas e vendas', icone: 'turmas' },
  ];

  return (
    <Painel itens={itens} inicio="/professor" nome={perfil.nome || 'Professor'} selo="Painel do professor">
      {children}
    </Painel>
  );
}
