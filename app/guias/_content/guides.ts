import type { Guide } from "./types";

export const GUIDES: Guide[] = [
  {
    slug: "como-controlar-fatura-do-cartao-de-credito",
    title: "Como controlar a fatura do cartão de crédito (sem surpresa no fim do mês)",
    description:
      "Entenda fechamento, vencimento e parcelas, saiba quanto vem na próxima fatura e aprenda um método simples para nunca mais se assustar com o cartão.",
    excerpt: "Fechamento, vencimento, parcelas e como prever a próxima fatura.",
    keywords: ["controlar fatura do cartão", "fatura do cartão de crédito", "data de fechamento do cartão", "parcelas no cartão"],
    published: "2026-10-10",
    updated: "2026-10-10",
    readingMinutes: 6,
    blocks: [
      {
        type: "p",
        text: "O cartão de crédito não é o vilão — o problema é que ele **separa o momento da compra do momento do pagamento**. Você compra hoje, mas só sente no bolso semanas depois, quando várias compras pequenas (e parcelas antigas) chegam juntas numa fatura só. Controlar o cartão é, basicamente, enxergar essa fatura antes dela chegar.",
      },
      { type: "h2", text: "Fechamento e vencimento: as duas datas que mandam em tudo" },
      {
        type: "p",
        text: "Toda fatura tem uma **data de fechamento** e uma **data de vencimento**. O fechamento é o último dia em que as compras entram naquela fatura; o vencimento é o dia de pagar. Uma compra feita **um dia depois do fechamento** só vai ser cobrada na fatura seguinte — por isso o famoso “melhor dia de compra” é logo após o fechamento.",
      },
      {
        type: "list",
        items: [
          "Compra antes do fechamento → entra na fatura que está aberta e vence no próximo vencimento.",
          "Compra depois do fechamento → vai para a fatura seguinte, quase 30 dias a mais de prazo.",
          "Parcelas → cada parcela cai em uma fatura diferente, uma por mês, a partir da fatura da compra.",
        ],
      },
      {
        type: "tip",
        title: "Atenção: o banco pode mudar o fechamento",
        text: "Alguns bancos alteram a data de fechamento (por exemplo, para alguns dias antes do vencimento). Confira o período de compras impresso na fatura de vez em quando — é ele que vale.",
      },
      { type: "h2", text: "O perigo invisível: as parcelas que você já assumiu" },
      {
        type: "p",
        text: "Quem parcela muito acaba com uma fatura “mínima” todo mês antes mesmo de passar o cartão de novo. Some todas as parcelas que ainda faltam e descubra quanto da sua renda já está comprometida nos próximos meses. Esse número costuma assustar — e é exatamente ele que evita a próxima dívida.",
      },
      { type: "h2", text: "Um método simples para controlar a fatura" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Anote a fatura atual e a próxima.** A atual já fechou e tem valor certo; a próxima ainda está crescendo com as compras do mês.",
          "**Liste as parcelas futuras** de cada mês até o fim de todas elas.",
          "**Defina um teto para o cartão.** Uma referência comum é manter a fatura abaixo de 30% da sua renda mensal.",
          "**Antes de parcelar algo novo, some a parcela às faturas futuras** e veja se algum mês passa do teto.",
          "**Pague sempre o valor total.** Pagar o mínimo leva ao rotativo, uma das dívidas mais caras do mercado.",
        ],
      },
      {
        type: "cta",
        title: "O FinPlan faz essa conta por você",
        text: "Importe o PDF da fatura e veja a fatura do mês, a próxima, as parcelas futuras e o uso do limite de cada cartão — com a data real de fechamento do seu banco. O simulador “Posso parcelar?” mostra o efeito de uma compra nos próximos meses antes de você passar o cartão.",
      },
      { type: "h2", text: "Cartões adicionais e cartão “emprestado”" },
      {
        type: "p",
        text: "Cartões adicionais (cônjuge, filhos) e cartões virtuais entram na mesma fatura do titular. Separe quem gastou o quê — uma observação em cada compra (“cartão da Ana”, “emprestado para o tio, devolve dia 10”) evita discussão e esquecimento na hora de pagar.",
      },
      { type: "h2", text: "Resumo" },
      {
        type: "list",
        items: [
          "Saiba as datas de fechamento e vencimento de cada cartão.",
          "Some as parcelas futuras: elas são renda que você já gastou.",
          "Tenha um teto (como 30% da renda) e simule antes de parcelar.",
          "Pague o total da fatura sempre que possível.",
        ],
      },
    ],
  },
  {
    slug: "planilha-de-gastos-mensais-ou-aplicativo",
    title: "Planilha de gastos mensais ou aplicativo: qual funciona melhor?",
    description:
      "Planilha ou app de finanças? Compare prós e contras, veja o que uma boa planilha de gastos precisa ter e descubra quando vale migrar para um aplicativo.",
    excerpt: "O que uma planilha precisa ter e quando um app resolve melhor.",
    keywords: ["planilha de gastos mensais", "planilha de controle financeiro", "aplicativo de finanças", "controle de gastos"],
    published: "2026-10-10",
    updated: "2026-10-10",
    readingMinutes: 5,
    blocks: [
      {
        type: "p",
        text: "A planilha é o primeiro passo de muita gente no controle financeiro — e funciona, enquanto você mantém o hábito. O problema quase nunca é a ferramenta: é **lançar gasto por gasto** todos os dias. Quando a rotina aperta, a planilha fica desatualizada e o controle se perde.",
      },
      { type: "h2", text: "O que uma boa planilha de gastos precisa ter" },
      {
        type: "list",
        items: [
          "**Data, descrição, valor e categoria** de cada gasto (alimentação, transporte, moradia, saúde…).",
          "**Forma de pagamento**, principalmente para separar o que foi no cartão de crédito.",
          "**Receitas do mês** e o saldo (receita menos despesas).",
          "**Contas fixas** (aluguel, luz, internet) em uma aba própria.",
          "**Total por categoria**, para enxergar onde o dinheiro está indo.",
        ],
      },
      { type: "h2", text: "Planilha: prós e contras" },
      {
        type: "list",
        items: [
          "Prós: gratuita, totalmente personalizável, você entende cada fórmula.",
          "Contras: tudo é manual; parcelas e faturas do cartão dão trabalho; no celular é pouco prática; erros de fórmula passam despercebidos.",
        ],
      },
      { type: "h2", text: "Quando um aplicativo resolve melhor" },
      {
        type: "p",
        text: "Se você usa cartão de crédito com frequência, parcela compras ou divide as finanças com alguém, um app costuma economizar horas por mês. O ganho maior não é o gráfico bonito — é **não precisar digitar tudo**.",
      },
      {
        type: "list",
        items: [
          "**Importar o extrato e a fatura** em vez de lançar um por um.",
          "**Registrar na hora da compra**, por mensagem ou áudio, sem abrir planilha.",
          "**Categorizar automaticamente** pelo seu histórico.",
          "**Calcular parcelas e faturas** nas datas certas de cada cartão.",
          "**Prever os próximos meses**, coisa difícil de montar numa planilha.",
        ],
      },
      {
        type: "cta",
        title: "Tudo o que a planilha faz, sem digitar",
        text: "No FinPlan você importa o PDF do extrato e da fatura, registra gastos pelo WhatsApp (texto ou áudio) e acompanha categorias, cartões e a previsão dos próximos 6 meses. O plano grátis já inclui uma importação por mês.",
      },
      { type: "h2", text: "Dá para usar os dois?" },
      {
        type: "p",
        text: "Dá, mas raramente vale a pena manter duas fontes de verdade. Se a planilha funciona para você, continue nela. Se ela vive desatualizada, é sinal de que o esforço de lançar está alto demais — e é isso que um app deve resolver.",
      },
    ],
  },
  {
    slug: "como-importar-extrato-bancario",
    title: "Como importar o extrato do banco para organizar suas finanças",
    description:
      "Aprenda a baixar o extrato da conta e a fatura do cartão em PDF ou OFX, o que observar antes de importar e como organizar tudo por categoria em minutos.",
    excerpt: "PDF ou OFX, o que baixar e como revisar antes de importar.",
    keywords: ["importar extrato bancário", "extrato em PDF", "arquivo OFX", "organizar extrato bancário"],
    published: "2026-10-10",
    updated: "2026-10-10",
    readingMinutes: 5,
    blocks: [
      {
        type: "p",
        text: "Lançar gasto por gasto é o motivo número um de abandono do controle financeiro. A alternativa é **trazer as transações direto do banco**: você baixa o extrato da conta e a fatura do cartão e importa tudo de uma vez, só revisando o que precisa.",
      },
      { type: "h2", text: "PDF ou OFX: qual baixar?" },
      {
        type: "list",
        items: [
          "**PDF** — é o formato que todo banco oferece, inclusive no celular. Extrato mensal da conta e fatura fechada do cartão normalmente estão disponíveis assim.",
          "**OFX** — arquivo padrão para softwares financeiros (às vezes chamado de “Money” ou “Quicken”). Nem todo banco oferece, principalmente no app de celular.",
        ],
      },
      {
        type: "tip",
        title: "Onde encontrar no app do banco",
        text: "Procure a área de extrato ou de faturas e a opção de exportar, compartilhar ou salvar em PDF. Em geral o extrato fica por mês e a fatura fica disponível depois que fecha.",
      },
      { type: "h2", text: "Antes de importar: o que conferir" },
      {
        type: "list",
        items: [
          "**O período completo** — um mês inteiro do extrato, ou a fatura fechada inteira.",
          "**Transferências entre suas próprias contas** — não são receita nem despesa, só dinheiro mudando de lugar.",
          "**Pagamento da fatura do cartão** no extrato da conta — as compras já contam quando acontecem; o pagamento não deve virar despesa de novo.",
          "**Estornos e cashback** na fatura — reduzem o valor gasto.",
          "**O que você já lançou à mão** — para não duplicar.",
        ],
      },
      {
        type: "cta",
        title: "No FinPlan, essas checagens são automáticas",
        text: "Envie o PDF ou OFX e o app identifica se é extrato ou fatura (e de qual cartão), reconhece pix entre suas contas e pagamento de fatura, marca o que já estava lançado e confere o total lido com o total do banco. Você só revisa e confirma — e nunca precisa informar a senha do banco.",
      },
      { type: "h2", text: "Depois de importar: categorias" },
      {
        type: "p",
        text: "Categorias transformam uma lista de lançamentos em respostas: quanto foi para mercado, delivery, transporte. Revise as categorias sugeridas nas primeiras importações — corrigir uma vez ensina o app para as próximas.",
      },
      { type: "h2", text: "Com que frequência importar?" },
      {
        type: "p",
        text: "Uma vez por mês, quando a fatura fecha e o extrato do mês está completo, já dá uma visão excelente. Quem quer acompanhar mais de perto pode importar toda semana e registrar o resto na hora, pelo WhatsApp.",
      },
    ],
  },
  {
    slug: "como-sair-das-dividas-do-cartao-de-credito",
    title: "Como sair das dívidas do cartão de crédito: um plano passo a passo",
    description:
      "Entenda o rotativo e o parcelamento da fatura, organize as dívidas por prioridade e monte um plano realista para sair do vermelho e não voltar.",
    excerpt: "Rotativo, parcelamento da fatura e um plano para sair do vermelho.",
    keywords: ["dívida no cartão de crédito", "rotativo do cartão", "sair das dívidas", "parcelamento da fatura"],
    published: "2026-10-10",
    updated: "2026-10-10",
    readingMinutes: 7,
    blocks: [
      {
        type: "p",
        text: "Dívida de cartão cresce rápido porque os juros do crédito rotativo estão entre os mais altos do mercado. A boa notícia: com um plano simples e números na mão, dá para sair — e, principalmente, não voltar.",
      },
      { type: "h2", text: "Rotativo e parcelamento da fatura: o que acontece quando você não paga tudo" },
      {
        type: "p",
        text: "Ao pagar menos que o total, o restante entra no **crédito rotativo**, com juros altos. Pelas regras atuais, o rotativo só pode ser usado até o vencimento da fatura seguinte; depois disso o banco precisa oferecer o **parcelamento** do saldo, normalmente com juros menores que os do rotativo. E desde janeiro de 2024, a soma de juros e encargos do rotativo e do parcelamento da fatura não pode passar de **100% do valor original da dívida**.",
      },
      {
        type: "tip",
        title: "Confira o CET na sua fatura",
        text: "A fatura informa o Custo Efetivo Total (CET) do rotativo e do parcelamento. Compare os dois com outras opções de crédito antes de decidir.",
      },
      { type: "h2", text: "Passo a passo para sair da dívida" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Pare de aumentar a dívida.** Suspenda novas compras parceladas até ter um plano.",
          "**Descubra o tamanho real do problema:** faturas em aberto, parcelamentos e todas as parcelas futuras.",
          "**Saia do rotativo o quanto antes.** Se não der para quitar, compare o parcelamento da fatura com um crédito mais barato (como consignado ou empréstimo pessoal com juros menores) para trocar dívida cara por barata.",
          "**Negocie.** Bancos costumam oferecer condições melhores em renegociação e em mutirões de negociação de dívidas.",
          "**Monte um orçamento com folga mensal** para pagar a dívida, cortando primeiro gastos variáveis (delivery, assinaturas pouco usadas).",
          "**Reconstrua uma reserva**, mesmo pequena, para que um imprevisto não vire dívida de cartão de novo.",
        ],
      },
      { type: "h2", text: "Como não voltar para o vermelho" },
      {
        type: "list",
        items: [
          "Mantenha a fatura abaixo de um teto, como **30% da renda**.",
          "Antes de parcelar, **some a parcela às faturas dos próximos meses** — se algum mês ficar negativo, não compre.",
          "Acompanhe a **sobra prevista** dos próximos meses, não só o saldo de hoje.",
        ],
      },
      {
        type: "cta",
        title: "Veja o vermelho antes de entrar nele",
        text: "O FinPlan soma receitas, contas fixas, faturas já comprometidas e o seu gasto médio para prever os próximos 6 meses — e avisa quando algum mês vai fechar negativo ou quando o cartão passa de 30% da renda.",
      },
      {
        type: "p",
        text: "Este guia é informativo e não substitui orientação financeira profissional. Em caso de superendividamento, procure o Procon ou a Defensoria Pública da sua cidade.",
      },
    ],
  },
  {
    slug: "como-montar-orcamento-mensal-50-30-20",
    title: "Como montar um orçamento mensal com o método 50/30/20",
    description:
      "Aprenda o método 50/30/20 para dividir a renda entre necessidades, desejos e futuro, com exemplo prático e dicas para adaptar à realidade brasileira.",
    excerpt: "Necessidades, desejos e futuro: dividindo a renda com exemplo prático.",
    keywords: ["orçamento mensal", "método 50/30/20", "como fazer orçamento", "organizar finanças pessoais"],
    published: "2026-10-10",
    updated: "2026-10-10",
    readingMinutes: 5,
    blocks: [
      {
        type: "p",
        text: "O método 50/30/20 é uma das formas mais simples de começar um orçamento: em vez de controlar dezenas de categorias, você divide a renda líquida em **três grandes blocos**.",
      },
      { type: "h2", text: "Os três blocos" },
      {
        type: "list",
        items: [
          "**50% — necessidades:** moradia, contas de consumo, mercado, transporte, saúde, educação.",
          "**30% — desejos:** restaurantes, delivery, lazer, viagens, assinaturas, compras não essenciais.",
          "**20% — futuro:** reserva de emergência, investimentos e quitação de dívidas.",
        ],
      },
      { type: "h2", text: "Exemplo com renda de R$ 4.000" },
      {
        type: "list",
        items: [
          "Necessidades: até R$ 2.000",
          "Desejos: até R$ 1.200",
          "Futuro: R$ 800",
        ],
      },
      {
        type: "tip",
        title: "Adapte à sua realidade",
        text: "Em muitas cidades, só o aluguel já consome boa parte da renda. Se as necessidades passam de 50%, comece pelo que é possível (por exemplo 60/30/10) e ajuste aos poucos. O importante é que o bloco do futuro nunca fique zerado.",
      },
      { type: "h2", text: "Como colocar em prática" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Some sua renda líquida** do mês (o que de fato cai na conta).",
          "**Liste as contas fixas** e veja quanto do bloco de necessidades elas já ocupam.",
          "**Defina limites por categoria** dentro de cada bloco (mercado, transporte, lazer…).",
          "**Separe o bloco do futuro no início do mês**, logo que o salário cair — não espere sobrar.",
          "**Acompanhe durante o mês** e corrija o rumo antes de estourar.",
        ],
      },
      {
        type: "cta",
        title: "Orçamento que se acompanha sozinho",
        text: "No FinPlan você define limites por categoria, cadastra as contas fixas e acompanha em tempo real quanto já foi gasto — com os gastos entrando pelo extrato importado ou pelo WhatsApp.",
      },
      { type: "h2", text: "E o cartão de crédito?" },
      {
        type: "p",
        text: "Gastos no cartão contam no mês em que você compra, não no mês em que paga a fatura. Classifique cada compra no bloco certo e fique de olho nas parcelas: elas ocupam o orçamento dos meses seguintes antes mesmo de você planejá-los.",
      },
    ],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
