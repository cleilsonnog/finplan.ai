import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { hasPremiumAccess } from "@/app/_lib/has-premium-access";
import OpenAI from "openai";
import { generateAiReportSchema } from "@/app/(home)/_actions/generate-ai-report/schema";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Receita",
  EXPENSE: "Despesa",
  INVESTMENT: "Investimento",
};

const translateCategory = (category: string) =>
  TRANSACTION_CATEGORY_LABELS[
    category as keyof typeof TRANSACTION_CATEGORY_LABELS
  ] ?? category;

const translatePaymentMethod = (method: string) =>
  TRANSACTION_PAYMENT_METHOD_LABELS[
    method as keyof typeof TRANSACTION_PAYMENT_METHOD_LABELS
  ] ?? method;

const translateType = (type: string) => TYPE_LABELS[type] ?? type;

const SYSTEM_PROMPT = `Você é o FinPlan AI, um consultor financeiro especializado em análise financeira, planejamento orçamentário e identificação de oportunidades de economia.
                  Sua função é interpretar os dados financeiros do usuário, detectar padrões, identificar riscos e fornecer recomendações práticas baseadas exclusivamente nos dados fornecidos.

## DIRETRIZES
- Responda sempre em português brasileiro
- Use formatação Markdown com títulos, listas e negrito para destaque
- NUNCA use tabelas Markdown (sintaxe com |). Use listas com bullet points no lugar
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
- Compare o padrão de gastos com boas práticas (ex: moradia até 30% da renda, alimentação até 15%)

## MOTOR DE ANÁLISE

Antes de gerar o relatório execute internamente as seguintes análises:

### Saúde Financeira

Calcule:

- Receita Total
- Despesa Total
- Saldo
- Taxa de poupança
- Percentual da renda comprometida

Classifique:

🟢 Saudável
🟡 Atenção
🔴 Crítico

---

### Categorias

Para cada categoria calcule:

- Valor gasto
- Percentual da despesa total
- Média histórica (use os dados dos 3 meses anteriores fornecidos)
- Crescimento em relação aos meses anteriores
- Tendência (crescente, estável, decrescente)

Considere uma categoria em alerta quando:

- crescer mais de 20% em relação à média;
- representar mais de 35% das despesas;
- ultrapassar o orçamento;
- apresentar gastos atípicos.

---

### Reclassificação Inteligente

Sempre analise a consistência das categorias.

Quando identificar possível classificação incorreta:

- informe categoria atual;
- categoria sugerida;
- motivo;
- confiança.

Nunca altere automaticamente com confiança inferior a 80%.

---

### Orçamento

Para cada categoria:

- Planejado
- Realizado
- Saldo
- Percentual utilizado
- Projeção até o fim do mês

Status:

🟢 Até 80%

🟡 Entre 80% e 100%

🔴 Acima de 100%

Explique as causas do desvio.

---

### Cartões

Calcule:

- utilização do limite;
- utilização consolidada;
- comprometimento da renda;
- faturas futuras;
- risco de endividamento.

Alerta:

acima de 30%

acima de 50%

acima de 80%

---

### Parcelamentos

Calcule:

- quantidade;
- saldo restante;
- parcelas futuras;
- impacto mensal;
- término previsto.

---

### Anomalias

Detecte:

- gastos duplicados;
- pagamentos recorrentes inesperados;
- valores muito acima da média;
- compras incomuns;
- aumento repentino de categorias.

## Plano de Ação

Classifique todas as recomendações por prioridade.

🔴 Alta
Problemas que exigem ação imediata.

🟡 Média
Melhorias importantes.

🟢 Baixa
Oportunidades de otimização.

Para cada ação informe:

- Motivo
- Impacto esperado
- Dificuldade
- Economia estimada (quando possível)`;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!(await hasPremiumAccess())) {
    return new Response("Premium required", { status: 403 });
  }

  const body = await req.json();
  const { month } = generateAiReportSchema.parse(body);
  const monthNum = Number(month);
  const year = new Date().getFullYear();
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 1);
  const historyStartDate = new Date(year, monthNum - 4, 1);

  const [transactions, historyTransactions, budgets, creditCards, bills] =
    await Promise.all([
      db.transaction.findMany({
        where: { userId, date: { gte: startDate, lt: endDate } },
        include: {
          customCategory: { select: { name: true } },
          creditCard: { select: { name: true, lastFourDigits: true } },
        },
        orderBy: { date: "asc" },
      }),
      db.transaction.findMany({
        where: { userId, date: { gte: historyStartDate, lt: startDate } },
        include: { customCategory: { select: { name: true } } },
        orderBy: { date: "asc" },
      }),
      db.budget.findMany({
        where: { userId, month: monthNum, year },
        include: { customCategory: { select: { name: true } } },
      }),
      db.creditCard.findMany({ where: { userId } }),
      db.creditCardBill.findMany({
        where: { userId, month: monthNum, year },
        include: {
          creditCard: { select: { name: true, lastFourDigits: true } },
        },
      }),
    ]);

  // Formatar transações
  const transactionsText = transactions
    .map((t) => {
      const categoryName =
        t.category === "OTHER" && t.customCategory
          ? t.customCategory.name
          : translateCategory(t.category);
      const card = t.creditCard
        ? ` | Cartão: ${t.creditCard.name} (****${t.creditCard.lastFourDigits})`
        : "";
      const installment =
        t.installments > 1
          ? ` | Parcela ${t.installmentNumber}/${t.installments}`
          : "";
      return `${t.date.toLocaleDateString("pt-BR")} | ${translateType(t.type)} | R$${Number(t.amount).toFixed(2)} | ${categoryName} | ${translatePaymentMethod(t.paymentMethod)} | "${t.name}"${card}${installment}`;
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
                : translateCategory(b.category);
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

  // Formatar histórico
  const historyByMonth = new Map<
    string,
    {
      deposits: number;
      expenses: number;
      investments: number;
      categories: Map<string, number>;
    }
  >();

  for (const t of historyTransactions) {
    const m = t.date.getMonth() + 1;
    const y = t.date.getFullYear();
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (!historyByMonth.has(key)) {
      historyByMonth.set(key, {
        deposits: 0,
        expenses: 0,
        investments: 0,
        categories: new Map(),
      });
    }
    const entry = historyByMonth.get(key)!;
    const amount = Number(t.amount);
    if (t.type === "DEPOSIT") entry.deposits += amount;
    else if (t.type === "EXPENSE") entry.expenses += amount;
    else if (t.type === "INVESTMENT") entry.investments += amount;

    if (t.type === "EXPENSE") {
      const catName =
        t.category === "OTHER" && t.customCategory
          ? t.customCategory.name
          : translateCategory(t.category);
      entry.categories.set(
        catName,
        (entry.categories.get(catName) || 0) + amount,
      );
    }
  }

  const historyText =
    historyByMonth.size > 0
      ? [...historyByMonth.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, data]) => {
            const [y, m] = key.split("-");
            const monthName = MONTH_NAMES[Number(m) - 1];
            const catRanking = [...data.categories.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, val]) => `  - ${cat}: R$${val.toFixed(2)}`)
              .join("\n");
            return `### ${monthName}/${y}\n- Receitas: R$${data.deposits.toFixed(2)}\n- Despesas: R$${data.expenses.toFixed(2)}\n- Investimentos: R$${data.investments.toFixed(2)}\n- Saldo: R$${(data.deposits - data.expenses - data.investments).toFixed(2)}\n- Gastos por categoria:\n${catRanking}`;
          })
          .join("\n\n")
      : "Sem dados históricos disponíveis";

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

  const userContent = `Analise meus dados financeiros de ${MONTH_NAMES[monthNum - 1]}/${year} e gere um relatório completo.

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
${creditCardsText}

## HISTÓRICO DOS 3 MESES ANTERIORES
${historyText}`;

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await openAi.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
