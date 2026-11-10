import Link from 'next/link';
import { Logo120 } from '@/components/Marca';
import { Cabecalho } from '@/components/Cabecalho';
import { EMPRESA, EXPERT, MARCA } from '@/lib/marca';
import { Calculadora, DiaDe120, Fases, MiniQuiz } from './Interativos';
import s from './landing.module.css';

export const metadata = {
  title: 'Como funciona',
  description: 'Eu tenho um plano para você chutar a CLT: 2 horas por dia, todos os dias, por 1 ano. Conheça o Método 120.',
};

const CTA = '/entrar?modo=criar';

const DORES = [
  ['Você chega do trabalho sem energia', 'e não sabe nem por onde começar. Abre o PDF, lê duas páginas e o dia acaba.'],
  ['Você já começou várias vezes', 'comprou curso, baixou material, montou cronograma. E parou no segundo mês.'],
  ['Você estuda e não vê resultado', 'porque passou semanas no assunto que quase não cai, e o que mais cai ficou para depois.'],
  ['Você sente que vai bater ponto a vida inteira', 'no mesmo emprego, com o mesmo salário, esperando o “dia certo” para começar.'],
];

const TREINO = [
  ['Questões no estilo da banca', 'Todo dia, nos blocos 1 e 2. Questões de provas anteriores e questões inéditas escritas pela equipe, no estilo da sua banca.'],
  ['Minissimulados', 'Aos domingos. Um pedaço da prova, no mesmo formato, para medir a sua evolução semana a semana.'],
  ['Simulados no padrão da prova', 'Mesmo número de questões, mesma distribuição de matérias e a regra de corte do edital: você vê se passaria.'],
  ['Caderno de erros', 'Os 20 minutos finais de cada dia. Cada questão errada volta até você acertar.'],
];

const PORQUE = [
  ['Você estuda primeiro o que mais cai', 'Cada disciplina pesa no plano conforme o número de questões que ela tem na sua prova. O que mais vale ponto aparece mais vezes.'],
  ['Todo dia vale mais que maratona', 'Duas horas cabem na rotina de quem trabalha, inclusive em escala de serviço. Um plano que você cumpre todos os dias vence o plano perfeito que você abandona.'],
  ['Você revisa antes de esquecer', 'O caderno de erros de todo dia traz de volta o que você errou, para o conteúdo continuar vivo até a prova.'],
  ['Você chega treinado no formato da prova', 'Os simulados seguem a quantidade de questões, o tipo de questão e as matérias do seu edital. No dia da prova, nada é novidade.'],
];

export default function ComoFunciona() {
  return (
    <div className={s.pagina}>
      <Cabecalho />

      {/* 1. Promessa */}
      <section className={`tema-escuro ${s.hero}`}>
        <div className={`container ${s.heroDentro}`}>
          <div className={s.heroTexto}>
            <span className={s.kicker}>Método 120</span>
            <h1 className="display">Eu tenho um <u>plano</u> para você <mark>chutar a CLT.</mark></h1>
            <p className={s.chips} aria-label="2 horas. Todos os dias. Por 1 ano."><span data-cor="vermelho">2 horas.</span><span data-cor="branco">Todos os dias.</span><span data-cor="azul">Por 1 ano.</span></p>
            <p className={s.heroLead}>
              Você não precisa largar o emprego para estudar, nem virar a madrugada. Precisa de um plano que caiba na sua rotina
              e diga exatamente o que fazer em cada um dos 120 minutos, do primeiro dia até a prova.
            </p>
            <div className="linha-flex">
              <Link href={CTA} className="btn btn-vermelho btn-grande">Quero o plano →</Link>
              <a href="#dia" className="btn btn-linha btn-grande">Ver como funciona</a>
            </div>
          </div>
          <figure className={s.heroFoto}>
            <img src={EXPERT.fotoCorpo ?? EXPERT.fotoRosto} alt={EXPERT.nome} width={900} height={900} />
            <figcaption><b>{EXPERT.nome}</b> · aprovado em {EXPERT.aprovacoes.length} concursos da segurança pública</figcaption>
          </figure>
        </div>
      </section>

      <main className="container">
        {/* 2. Dor */}
        <section className={s.secao} aria-labelledby="dor">
          <span className="rotulo">Se você se reconhece</span>
          <h2 id="dor" className="display">O problema não é você. É estudar sem plano.</h2>
          <div className={s.grade2}>
            {DORES.map(([t, d]) => (
              <div key={t} className={s.dor}><b>{t}</b> <span>{d}</span></div>
            ))}
          </div>
          <p className={s.ponte}>
            Ninguém sai da CLT estudando “quando dá”. Sai quem tem um caminho claro: <b>o que estudar, quanto tempo e em que ordem.</b> É
            isso que o Método 120 entrega, pronto, todos os dias.
          </p>
        </section>

        {/* 3. Números */}
        <section className={s.numeros} aria-label="O plano em números">
          <div><b className="display">120 min</b><span>por dia, todos os dias</span></div>
          <div><b className="display">365 dias</b><span>de plano, do início à prova</span></div>
          <div><b className="display">730 h</b><span>de estudo no ano, sem largar o emprego</span></div>
        </section>

        {/* 4. O dia */}
        <section id="dia" className={s.secao} aria-labelledby="dia-titulo">
          <span className="rotulo">O seu dia de estudo</span>
          <h2 id="dia-titulo" className="display">120 minutos, sempre no mesmo formato</h2>
          <p className={s.lead}>Você não perde tempo decidindo o que estudar. Abre o site, vê o plano de hoje e cumpre os três blocos. Toque em um bloco para ver o que tem nele.</p>
          <DiaDe120 />
        </section>

        {/* 5. Fases */}
        <section className={s.secao} aria-labelledby="fases">
          <span className="rotulo">Os 12 meses</span>
          <h2 id="fases" className="display">Três fases: primeiro o que mais cai, depois o resto</h2>
          <p className={s.lead}>O formato do dia nunca muda. O que muda é o que entra em cada bloco. A duração de cada fase depende do seu edital: se o que mais cai é extenso, a Fase 1 ganha mais semanas.</p>
          <Fases />
          <Calculadora />
        </section>

        {/* 6. Treino */}
        <section className={s.secao} aria-labelledby="treino">
          <span className="rotulo">Como você treina</span>
          <h2 id="treino" className="display">Teoria sozinha não aprova ninguém</h2>
          <p className={s.lead}>No Método 120 você resolve questões todos os dias e faz simulados no mesmo formato da prova da sua banca.</p>
          <div className={s.grade4}>
            {TREINO.map(([t, d], i) => (
              <div key={t} className={s.treino}><span className={s.treinoNum}>{i + 1}</span><b>{t}</b><p>{d}</p></div>
            ))}
          </div>
        </section>

        {/* 7. Teste */}
        <section className={s.secao} aria-labelledby="teste">
          <span className="rotulo">Experimente agora</span>
          <h2 id="teste" className="display">Um minissimulado de 3 questões</h2>
          <MiniQuiz ctaHref={CTA} />
        </section>

        {/* 8. Por quê */}
        <section className={s.secao} aria-labelledby="porque">
          <span className="rotulo">Por que funciona</span>
          <h2 id="porque" className="display">Não é estudar mais que todo mundo. É estudar o que importa, todo dia.</h2>
          <div className={s.grade2}>
            {PORQUE.map(([t, d]) => <div key={t} className={s.porque}><b>{t}</b><p>{d}</p></div>)}
          </div>
        </section>

        {/* 9. Promessa honesta */}
        <section className={s.honesto} aria-labelledby="promessa">
          <h2 id="promessa" className="display">O que a gente promete, e o que não promete</h2>
          <p>
            Ninguém pode prometer a sua aprovação: ela depende da prova, das vagas e de você. Quem promete isso está vendendo, não ensinando.
            O que o Método 120 promete é o <b>caminho</b>: um plano de 2 horas por dia, do primeiro dia até a prova, com as questões, os simulados e as revisões de que você precisa para cumprir.
          </p>
          <p>
            <b>Os 12 meses valem para quem começa antes do edital.</b> Com o edital já publicado, o tempo até a prova é curto e o plano entra na <b>Reta Final</b>: mais questões da banca, revisões rápidas e simulados completos toda semana.
          </p>
        </section>

        {/* 10. Expert */}
        <section className={`cartao ${s.expert}`} aria-labelledby="expert">
          <img src={EXPERT.fotoRosto} alt={EXPERT.nome} width={180} height={180} />
          <div>
            <span className="rotulo">{EXPERT.chamada}</span>
            <h2 id="expert" className="display">{EXPERT.nome}</h2>
            <p>{EXPERT.resumo}</p>
            <ul>{EXPERT.aprovacoes.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </section>
      </main>

      {/* 11. Chamada final */}
      <section className={`tema-escuro ${s.final}`}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', textAlign: 'center' }}>
          <h2 className="display">Daqui a 1 ano, você pode estar fazendo a prova que muda a sua vida.<br />Ou ainda batendo ponto.</h2>
          <p>Comece antes do edital sair: quanto antes você começa, mais calma o plano tem para passar pelas três fases.</p>
          <div className="linha-flex" style={{ justifyContent: 'center' }}>
            <Link href={CTA} className="btn btn-azul btn-grande">Criar minha conta grátis</Link>
            <a href="#teste" className="btn btn-linha btn-grande">Testar o minissimulado</a>
          </div>
        </div>
      </section>

      <footer className={`tema-escuro ${s.rodape}`}>
        <div className="container linha-flex" style={{ justifyContent: 'space-between' }}>
          <Logo120 tamanho={40} slogan />
          <span className="linha-flex" style={{ gap: 16 }}><Link href="/">Início</Link><Link href="/termos">Termos</Link><Link href="/privacidade">Privacidade</Link></span>
          <small style={{ opacity: 0.6, width: '100%' }}>{EMPRESA.razao} · CNPJ {EMPRESA.cnpj}. {MARCA.nome} não tem vínculo com bancas organizadoras nem com os órgãos citados.</small>
        </div>
      </footer>
    </div>
  );
}
