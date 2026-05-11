"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { hasPremiumAccess } from "@/app/_lib/has-premium-access";
import OpenAI from "openai";
import { GenerateAiReportSchema, generateAiReportSchema } from "./schema";

const DUMMY_REPORT =
  '### Relatório de Finanças Pessoais\n\n#### Resumo Geral das Finanças\nAs transações listadas foram analisadas e as seguintes informações foram extraídas para oferecer insights sobre suas finanças:\n\n- **Total de despesas:** R$ 19.497,56\n- **Total de investimentos:** R$ 14.141,47\n- **Total de depósitos/correntes:** R$ 10.100,00 (considerando depósitos de salário e outros)\n- **Categoria de maior despesa:** Alimentação\n\n#### Análise por Categoria\n\n1. **Alimentação:** R$ 853,76\n2. **Transporte:** R$ 144,05\n3. **Entretenimento:** R$ 143,94\n4. **Outras despesas:** R$ 17.828,28 (inclui categorias como saúde, educação, habitação)\n\n#### Tendências e Insights\n- **Despesas Elevadas em Alimentação:** A categoria de alimentação representa uma parte significativa de suas despesas, com um total de R$ 853,76 nos últimos meses. É importante monitorar essa categoria para buscar economia.\n  \n- **Despesas Variáveis:** Outros tipos de despesas, como entretenimento e transporte, também se acumulam ao longo do mês. Identificar dias em que se gasta mais pode ajudar a diminuir esses custos.\n  \n- **Investimentos:** Você fez investimentos significativos na ordem de R$ 14.141,47. Isso é um bom sinal para a construção de patrimônio e aumento de sua segurança financeira no futuro.\n  \n- **Categorização das Despesas:** Há uma série de despesas listadas como "OUTRA", que podem ser reavaliadas. Classificar essas despesas pode ajudar a ter um controle melhor das finanças.\n\n#### Dicas para Melhorar Sua Vida Financeira\n\n1. **Crie um Orçamento Mensal:** Defina um limite de gastos para cada categoria. Isso ajuda a evitar gastos excessivos em áreas como alimentação e entretenimento.\n\n2. **Reduza Gastos com Alimentação:** Considere cozinhar em casa com mais frequência, planejar refeições e usar listas de compras para evitar compras impulsivas.\n\n3. **Revise Despesas Recorrentes:** Dê uma olhada nas suas despesas fixas (como saúde e educação) para verificar se estão adequadas às suas necessidades e se há espaço para redução.\n\n4. **Estabeleça Metas de Poupança:** Com base em seus depósitos e investimentos, estabeleça metas específicas para economizar uma porcentagem do seu rendimento mensal. Estimar quanto você pode economizar pode ajudar a garantir uma reserva de emergência.\n\n5. **Diminua os Gastos com Entretenimento:** Planeje lazer de forma que não exceda seu orçamento, busque opções gratuitas ou de baixo custo. Lembre-se de que entretenimento também pode ser feito em casa.\n\n6. **Reavalie Seus Investimentos:** Certifique-se de que seus investimentos estejam alinhados com seus objetivos financeiros a curto e longo prazo. Pesquise alternativas que podem oferecer melhor retorno.\n\n7. **Acompanhe Suas Finanças Regularmente:** Use aplicativos de gerenciamento financeiro para controlar suas despesas e receitas, ajudando você a manter-se informado sobre sua saúde financeira.\n\n#### Conclusão\nMelhorar sua vida financeira é um processo contínuo que envolve planejamento, monitoramento e ajustes regulares. Com as análises e as sugestões acima, você pode começar a tomar decisões financeiras mais estratégicas para alcançar seus objetivos. Lembre-se que cada real economizado é um passo a mais em direção à segurança financeira!';

export const generateAiReport = async ({ month }: GenerateAiReportSchema) => {
  generateAiReportSchema.parse({ month });
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!(await hasPremiumAccess())) {
    throw new Error("You need a premium plan to generate AI reports");
  }
  if (!process.env.OPENAI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return DUMMY_REPORT;
  }

  const year = new Date().getFullYear();
  const monthNum = Number(month);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 1);

  // Buscar dados em paralelo
  const openAi = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const [transactions, budgets, creditCards, bills] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
      include: {
        customCategory: { select: { name: true } },
        creditCard: { select: { name: true, lastFourDigits: true } },
      },
      orderBy: { date: "asc" },
    }),
    db.budget.findMany({
      where: { userId, month: monthNum, year },
      include: { customCategory: { select: { name: true } } },
    }),
    db.creditCard.findMany({
      where: { userId },
    }),
    db.creditCardBill.findMany({
      where: { userId, month: monthNum, year },
      include: { creditCard: { select: { name: true, lastFourDigits: true } } },
    }),
  ]);

  // Formatar transações
  const transactionsText = transactions
    .map((t) => {
      const categoryName =
        t.category === "OTHER" && t.customCategory
          ? t.customCategory.name
          : t.category;
      const card = t.creditCard
        ? ` | Cartão: ${t.creditCard.name} (****${t.creditCard.lastFourDigits})`
        : "";
      const installment =
        t.installments > 1
          ? ` | Parcela ${t.installmentNumber}/${t.installments}`
          : "";
      return `${t.date.toLocaleDateString("pt-BR")} | ${t.type} | R$${Number(t.amount).toFixed(2)} | ${categoryName} | ${t.paymentMethod} | "${t.name}"${card}${installment}`;
    })
    .join("\n");

  // Formatar orçamentos
  const budgetsText =
    budgets.length > 0
      ? budgets
          .map((b) => {
            const catName =
              b.category === "OTHER" && b.customCategory
                ? b.customCategory.name
                : b.category;
            return `${catName}: R$${Number(b.amount).toFixed(2)}`;
          })
          .join("\n")
      : "Nenhum orçamento definido";

  // Formatar cartões e faturas
  const creditCardsText =
    creditCards.length > 0
      ? creditCards
          .map((cc) => {
            const bill = bills.find((b) => b.creditCardId === cc.id);
            const billInfo = bill
              ? `Fatura: R$${Number(bill.totalAmount).toFixed(2)} (${bill.status}) | Fecha dia ${cc.closingDay} | Vence dia ${cc.dueDay}`
              : "Sem fatura no mês";
            return `${cc.name} (****${cc.lastFourDigits}) | Limite: R$${Number(cc.limit).toFixed(2)} | ${billInfo}`;
          })
          .join("\n")
      : "Nenhum cartão cadastrado";

  // Calcular resumo
  const totalDeposits = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalInvestments = transactions
    .filter((t) => t.type === "INVESTMENT")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalDeposits - totalExpenses - totalInvestments;

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const userContent = `Analise meus dados financeiros de ${monthNames[monthNum - 1]}/${year} e gere um relatório completo.

## RESUMO DO MÊS
- Receitas (depósitos): R$${totalDeposits.toFixed(2)}
- Despesas: R$${totalExpenses.toFixed(2)}
- Investimentos: R$${totalInvestments.toFixed(2)}
- Saldo: R$${balance.toFixed(2)}
- Total de transações: ${transactions.length}

## TRANSAÇÕES
${transactionsText || "Nenhuma transação no período"}

## ORÇAMENTOS DEFINIDOS
${budgetsText}

## CARTÕES DE CRÉDITO
${creditCardsText}`;

  const completion = await openAi.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Você é o FinPlan AI, um consultor financeiro pessoal inteligente e experiente. Seu papel é analisar os dados financeiros do usuário e gerar relatórios detalhados, personalizados e acionáveis.

## DIRETRIZES
- Responda sempre em português brasileiro
- Use formatação Markdown com títulos, listas e negrito para destaque
- Seja direto, prático e específico — evite conselhos genéricos
- Base suas análises nos DADOS REAIS fornecidos, não invente números
- Use emojis com moderação para tornar o relatório mais visual
- Valores monetários sempre no formato R$ X.XXX,XX

## ESTRUTURA DO RELATÓRIO
1. **Resumo Executivo** — visão geral da saúde financeira do mês (receitas vs despesas, saldo)
2. **Análise de Gastos por Categoria** — ranking das categorias com maior gasto, percentual sobre o total
3. **Cartões de Crédito** — análise do uso dos cartões, nível de comprometimento do limite, faturas abertas/atrasadas, alerta se uso > 30% do limite
4. **Orçamento vs Realidade** — se o usuário definiu orçamentos, compare o planejado com o realizado por categoria e destaque estouros
5. **Compras Parceladas** — identifique parcelas ativas e o comprometimento futuro
6. **Padrões e Alertas** — identifique padrões de gasto (dias com mais despesas, gastos recorrentes, categorias crescentes)
7. **Dicas Personalizadas** — 3 a 5 ações concretas e específicas baseadas nos dados do usuário, não conselhos genéricos
8. **Score do Mês** — dê uma nota de 0 a 10 para a saúde financeira do mês com justificativa

## REGRAS IMPORTANTES
- Se receitas > despesas, parabenize mas sugira investir o excedente
- Se despesas > receitas, alerte com urgência e sugira cortes específicos
- Se há faturas atrasadas (OVERDUE), destaque como prioridade máxima
- Se não há orçamento definido, recomende criar um
- Parcelas comprometem renda futura — sempre mencione o impacto
- Compare o padrão de gastos com boas práticas (ex: moradia até 30% da renda, alimentação até 15%)`,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  return completion.choices[0].message.content;
};
