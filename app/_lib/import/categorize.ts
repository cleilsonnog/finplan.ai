import OpenAI from "openai";
import type {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { normalizeMerchant, stripAccents } from "./normalize";
import type { CategorySource, LineAction, StatementKind, StatementLine } from "./types";

// ---------------------------------------------------------------------------------------------
// 1. What the line is (income / expense / bill payment ...) and how it was paid
// ---------------------------------------------------------------------------------------------

const BILL_PAYMENT = /(pagamento|pagto|pgto|pag)\s*(de\s*)?(da\s*)?fatura|fatura\s*(do\s*)?cart|pag(amento|to)?\s*cart(ao)?\s*(de\s*)?cred/;
const CARD_PAYMENT_RECEIVED = /pagamento\s*(recebido|efetuado)|pagto\s*recebido|credito\s*de\s*pagamento|pagamento\s*fatura/;
const INVESTMENT = /aplicacao|aplic\b|\bcdb\b|\blci\b|\blca\b|tesouro|invest|poupanca|previdencia|corretora|\bxp\b|rico\s*invest/;
const SALARY = /salario|folha\s*(de\s*)?pag|proventos|pagto\s*sal|remuneracao|pro\s*labore/;

export interface Classification {
  action: LineAction;
  type: TransactionType;
  paymentMethod: TransactionPaymentMethod;
}

export const classifyLine = (line: StatementLine, kind: StatementKind): Classification => {
  const text = stripAccents(`${line.memo ?? ""} ${line.description}`.toLowerCase());

  if (kind === "CREDIT_CARD") {
    // The previous bill's payment is not spending. Other credits (refunds, cashback, discounts)
    // are kept: they become negative expenses that lower the bill and the month's spending.
    if (CARD_PAYMENT_RECEIVED.test(text)) {
      return { action: "IGNORE", type: "EXPENSE", paymentMethod: "CREDIT_CARD" };
    }
    return { action: "TRANSACTION", type: "EXPENSE", paymentMethod: "CREDIT_CARD" };
  }

  const paymentMethod: TransactionPaymentMethod = /\bpix\b/.test(text)
    ? "PIX"
    : /boleto|bloqueto|titulo/.test(text)
      ? "BANK_SLIP"
      : /\bted\b|\bdoc\b|transf/.test(text)
        ? "BANK_TRANSFER"
        : /saque/.test(text)
          ? "CASH"
          : /cartao|debito|compra|elo\b|visa\s*electron|maestro/.test(text)
            ? "DEBIT_CARD"
            : "OTHER";

  if (line.ownTransfer) {
    return { action: "IGNORE", type: line.amount > 0 ? "DEPOSIT" : "EXPENSE", paymentMethod };
  }
  if (line.amount > 0) {
    return { action: "TRANSACTION", type: "DEPOSIT", paymentMethod };
  }
  if (BILL_PAYMENT.test(text)) {
    return { action: "BILL_PAYMENT", type: "EXPENSE", paymentMethod };
  }
  if (INVESTMENT.test(text)) {
    return { action: "TRANSACTION", type: "INVESTMENT", paymentMethod };
  }
  return { action: "TRANSACTION", type: "EXPENSE", paymentMethod };
};

// ---------------------------------------------------------------------------------------------
// 2. Category — first match wins: learned rule → user history → keyword → AI → OTHER
// ---------------------------------------------------------------------------------------------

export interface CategoryGuess {
  category: TransactionCategory;
  customCategoryId: string | null;
  source: CategorySource;
}

const KEYWORDS: [RegExp, TransactionCategory][] = [
  [/mercado|supermerc|atacad|assai|carrefour|extra\b|pao de acucar|hortifruti|sacolao|acougue|padaria|panificadora|ifood|ifd|rappi|restaurante|lanchonete|pizzaria|burger|mc ?donald|bk\b|habib|subway|cafe|cafeteria|doceria|sorveteria|bar\b|churrascaria|food/, "FOOD"],
  [/posto|combustiv|gasolina|etanol|shell|ipiranga|petrobras|\bbr\b mania|uber|99 ?app|99pop|cabify|taxi|estacionamento|estapar|sem parar|conectcar|veloe|pedagio|metro|onibus|bilhete unico|cptm|detran|ipva|mecanica|auto ?pecas|borracharia|oficina|lava ?jato/, "TRANSPORTATION"],
  [/farmacia|farma\b|drogaria|droga ?raia|drogasil|pague menos|panvel|hospital|clinica|laboratorio|odonto|dentista|medic|unimed|amil|hapvida|sulamerica|bradesco saude|consulta|exame|otica|academia|smart ?fit|bluefit|gympass|wellhub/, "HEALTH"],
  [/aluguel|condominio|imobiliaria|iptu|leroy|telhanorte|c ?& ?c|madeira ?madeira|material de constru|moveis|tok ?stok|casas bahia/, "HOUSING"],
  [/energia|enel|cemig|copel|light\b|cpfl|celesc|coelba|eletropaulo|sabesp|cedae|copasa|saneago|agua|gas\b|comgas|ultragaz|liquigas|internet|vivo|claro|tim\b|oi\b|net\b|telefonica|nio\b|sky\b/, "UTILITY"],
  [/netflix|spotify|disney|hbo|max\b|prime video|amazon prime|globoplay|deezer|youtube|apple\.com|google play|steam|playstation|xbox|nintendo|cinema|cinemark|ingresso|sympla|eventim|show|teatro|parque/, "ENTERTAINMENT"],
  [/escola|colegio|faculdade|universidade|curso|udemy|alura|coursera|livraria|livro|papelaria|kalunga|mensalidade escolar|idioma|ingles/, "EDUCATION"],
];

interface Matcher {
  key: string;
  category: TransactionCategory;
  customCategoryId: string | null;
}

const toKey = (s: string) => normalizeMerchant(s);

/** Rules and history are matched by merchant key: exact, or one contains the other */
const findMatch = (merchant: string, matchers: Matcher[]) => {
  if (!merchant) return undefined;
  return (
    matchers.find((m) => m.key === merchant) ??
    matchers
      .filter((m) => m.key.length >= 4 && (merchant.includes(m.key) || m.key.includes(merchant)))
      .sort((a, b) => b.key.length - a.key.length)[0]
  );
};

const AI_MODEL = "gpt-4o-mini";

const aiCategorize = async (
  descriptions: string[],
  customCategories: { id: string; name: string }[],
): Promise<(CategoryGuess | null)[]> => {
  if (descriptions.length === 0 || !process.env.OPENAI_API_KEY) return descriptions.map(() => null);

  const builtIn = ["HOUSING", "TRANSPORTATION", "FOOD", "ENTERTAINMENT", "HEALTH", "UTILITY", "EDUCATION", "OTHER"];
  const customKeys = customCategories.map((c) => `CUSTOM:${c.name}`);
  const allowed = [...builtIn, ...customKeys];

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: AI_MODEL,
      temperature: 0,
      input: [
        {
          role: "system",
          content:
            "Você classifica lançamentos de extrato bancário brasileiro em categorias de despesa. " +
            "HOUSING=moradia, TRANSPORTATION=transporte/combustível/carro, FOOD=alimentação/mercado/restaurante, " +
            "ENTERTAINMENT=lazer/streaming, HEALTH=saúde/farmácia/academia, UTILITY=contas de consumo (luz, água, internet, telefone), " +
            "EDUCATION=educação, OTHER=quando não der para saber. Categorias CUSTOM:<nome> são do usuário — use quando claramente se aplicam. " +
            "Responda uma categoria por índice, na mesma ordem.",
        },
        {
          role: "user",
          content: descriptions.map((d, i) => `${i}: ${d.slice(0, 80)}`).join("\n"),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "categories",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer" },
                    category: { type: "string", enum: allowed },
                  },
                  required: ["index", "category"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(response.output_text) as { items: { index: number; category: string }[] };
    const byIndex = new Map(parsed.items.map((it) => [it.index, it.category]));
    return descriptions.map((_, i) => {
      const value = byIndex.get(i);
      if (!value || value === "OTHER") return null;
      if (value.startsWith("CUSTOM:")) {
        const custom = customCategories.find((c) => `CUSTOM:${c.name}` === value);
        return custom ? { category: "OTHER", customCategoryId: custom.id, source: "ai" } : null;
      }
      return { category: value as TransactionCategory, customCategoryId: null, source: "ai" };
    });
  } catch (err) {
    // Categorization must never block an import — fall back to OTHER
    console.error("AI categorization failed:", err);
    return descriptions.map(() => null);
  }
};

/**
 * Category for each expense description. Only descriptions no rule/history/keyword
 * could place are sent to the AI (merchant text only — never amounts or account data).
 */
export const categorizeExpenses = async (
  userId: string,
  descriptions: string[],
  customCategories: { id: string; name: string }[],
): Promise<CategoryGuess[]> => {
  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const [rules, history] = await Promise.all([
    db.categoryRule.findMany({ where: { userId } }),
    db.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: since } },
      select: { name: true, category: true, customCategoryId: true },
      orderBy: { date: "desc" },
      take: 3000,
    }),
  ]);

  const ruleMatchers: Matcher[] = rules.map((r) => ({
    key: r.pattern,
    category: r.category,
    customCategoryId: r.customCategoryId,
  }));

  // Most frequent category per merchant in the user's own history
  const counts = new Map<string, Map<string, number>>();
  for (const t of history) {
    const key = toKey(t.name.replace(/\(whatsapp\)/i, ""));
    if (!key) continue;
    const catKey = `${t.category}|${t.customCategoryId ?? ""}`;
    if (!counts.has(key)) counts.set(key, new Map());
    const c = counts.get(key)!;
    c.set(catKey, (c.get(catKey) ?? 0) + 1);
  }
  const historyMatchers: Matcher[] = Array.from(counts.entries())
    .map(([key, c]) => {
      const [best] = Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
      const [category, customCategoryId] = best[0].split("|");
      return {
        key,
        category: category as TransactionCategory,
        customCategoryId: customCategoryId || null,
      };
    })
    // OTHER in history says nothing — let the next layers try
    .filter((m) => m.category !== "OTHER" || m.customCategoryId);

  const guesses: (CategoryGuess | null)[] = descriptions.map((description) => {
    const merchant = toKey(description);
    const rule = findMatch(merchant, ruleMatchers);
    if (rule) return { category: rule.category, customCategoryId: rule.customCategoryId, source: "rule" };
    const past = findMatch(merchant, historyMatchers);
    if (past) return { category: past.category, customCategoryId: past.customCategoryId, source: "history" };
    const text = stripAccents(description.toLowerCase());
    const keyword = KEYWORDS.find(([re]) => re.test(text));
    if (keyword) return { category: keyword[1], customCategoryId: null, source: "keyword" };
    return null;
  });

  const pending = guesses.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0);
  const aiResults = await aiCategorize(
    pending.map((i) => descriptions[i]),
    customCategories,
  );
  pending.forEach((i, k) => {
    guesses[i] = aiResults[k];
  });

  return guesses.map((g) => g ?? { category: "OTHER", customCategoryId: null, source: "default" });
};

export const depositCategory = (description: string): TransactionCategory =>
  SALARY.test(stripAccents(description.toLowerCase())) ? "SALARY" : "OTHER";
