import { db } from "@/app/_lib/prisma";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "finplanai";

// Maps pt-BR words to enums
const TYPE_MAP: Record<string, TransactionType> = {
  gastei: "EXPENSE",
  gasto: "EXPENSE",
  despesa: "EXPENSE",
  paguei: "EXPENSE",
  comprei: "EXPENSE",
  recebi: "DEPOSIT",
  receita: "DEPOSIT",
  salario: "DEPOSIT",
  "salário": "DEPOSIT",
  ganhei: "DEPOSIT",
  investi: "INVESTMENT",
  investimento: "INVESTMENT",
  apliquei: "INVESTMENT",
};

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  moradia: "HOUSING",
  casa: "HOUSING",
  aluguel: "HOUSING",
  transporte: "TRANSPORTATION",
  "alimentação": "FOOD",
  alimentacao: "FOOD",
  comida: "FOOD",
  mercado: "FOOD",
  restaurante: "FOOD",
  lanche: "FOOD",
  entretenimento: "ENTERTAINMENT",
  lazer: "ENTERTAINMENT",
  "diversão": "ENTERTAINMENT",
  diversao: "ENTERTAINMENT",
  "saúde": "HEALTH",
  saude: "HEALTH",
  farmacia: "HEALTH",
  "farmácia": "HEALTH",
  utilidade: "UTILITY",
  utilidades: "UTILITY",
  conta: "UTILITY",
  "salário": "SALARY",
  salario: "SALARY",
  "educação": "EDUCATION",
  educacao: "EDUCATION",
  curso: "EDUCATION",
  escola: "EDUCATION",
  faculdade: "EDUCATION",
  outro: "OTHER",
  outros: "OTHER",
};

const PAYMENT_MAP: Record<string, TransactionPaymentMethod> = {
  "crédito": "CREDIT_CARD",
  credito: "CREDIT_CARD",
  "cartão": "CREDIT_CARD",
  cartao: "CREDIT_CARD",
  "débito": "DEBIT_CARD",
  debito: "DEBIT_CARD",
  "transferência": "BANK_TRANSFER",
  transferencia: "BANK_TRANSFER",
  ted: "BANK_TRANSFER",
  boleto: "BANK_SLIP",
  dinheiro: "CASH",
  pix: "PIX",
  outro: "OTHER",
};

const CATEGORY_LABELS: Record<string, string> = {
  HOUSING: "Moradia",
  TRANSPORTATION: "Transporte",
  FOOD: "Alimentacao",
  ENTERTAINMENT: "Entretenimento",
  HEALTH: "Saude",
  UTILITY: "Utilidades",
  SALARY: "Salario",
  EDUCATION: "Educacao",
  OTHER: "Outros",
};

const PAYMENT_LABELS: Record<string, string> = {
  CREDIT_CARD: "Cartao de Credito",
  DEBIT_CARD: "Cartao de Debito",
  BANK_TRANSFER: "Transferencia",
  BANK_SLIP: "Boleto",
  CASH: "Dinheiro",
  PIX: "Pix",
  OTHER: "Outros",
};

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: "Despesa",
  DEPOSIT: "Deposito",
  INVESTMENT: "Investimento",
};

async function sendWhatsApp(phone: string, message: string) {
  try {
    await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: phone,
          textMessage: { text: message },
        }),
      },
    );
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  name: string;
}

function parseMessage(text: string): Partial<ParsedTransaction> | null {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  let type: TransactionType | undefined;
  let amount: number | undefined;
  let category: TransactionCategory | undefined;
  let paymentMethod: TransactionPaymentMethod | undefined;

  for (const word of words) {
    if (!type && TYPE_MAP[word]) {
      type = TYPE_MAP[word];
    }

    if (!amount) {
      // Match numbers like 50, 50.00, 50,00, 1500, 1.500,00
      const cleaned = word.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) {
        amount = num;
      }
    }

    if (!category && CATEGORY_MAP[word]) {
      category = CATEGORY_MAP[word];
    }

    if (!paymentMethod && PAYMENT_MAP[word]) {
      paymentMethod = PAYMENT_MAP[word];
    }
  }

  if (!type && !amount) return null;

  return {
    type: type || "EXPENSE",
    amount,
    category,
    paymentMethod,
  };
}

function buildTransactionName(parsed: ParsedTransaction): string {
  return `${TYPE_LABELS[parsed.type]} - ${CATEGORY_LABELS[parsed.category]} (WhatsApp)`;
}

export const POST = async (request: Request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Evolution API sends different event types
  const event = body.event;

  // Only process incoming messages
  if (event !== "messages.upsert") {
    return NextResponse.json({ received: true });
  }

  const message = body.data;
  if (!message) {
    return NextResponse.json({ received: true });
  }

  // Skip messages sent by the bot (via API) — only process messages from mobile
  const source = message.source || "";
  if (message.key?.fromMe && source !== "android" && source !== "ios") {
    return NextResponse.json({ received: true });
  }

  // Extract phone from sender field (top-level) or remoteJid fallback
  // Evolution API v1.8.6+ uses LID format in remoteJid, but sender has the real number
  const senderField = body.sender || "";
  const remoteJid = message.key?.remoteJid || "";
  const phone = senderField.replace("@s.whatsapp.net", "")
    || remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    "";

  if (!phone || !text) {
    return NextResponse.json({ received: true });
  }

  // Find linked user
  const link = await db.whatsAppLink.findUnique({ where: { phone } });
  if (!link) {
    await sendWhatsApp(
      phone,
      "Seu numero nao esta vinculado ao Finplan.ai. Acesse o app e vincule seu WhatsApp nas configuracoes.",
    );
    return NextResponse.json({ received: true });
  }

  const userId = link.userId;
  const normalizedText = normalizeText(text);

  // Check for help command
  if (normalizedText === "ajuda" || normalizedText === "help") {
    await sendWhatsApp(
      phone,
      `*Finplan.ai - Comandos*\n\n` +
        `*Cadastrar transacao:*\n` +
        `gastei 50 alimentacao pix\n` +
        `recebi 3000 salario transferencia\n` +
        `investi 500 educacao pix\n\n` +
        `*Tipos:* gastei, recebi, investi\n` +
        `*Categorias:* moradia, transporte, alimentacao, entretenimento, saude, utilidades, salario, educacao, outros\n` +
        `*Pagamento:* pix, credito, debito, dinheiro, transferencia, boleto\n\n` +
        `Se pagar com *credito*, vou perguntar qual cartao e quantas parcelas.`,
    );
    return NextResponse.json({ received: true });
  }

  // Check if there's an active session (waiting for card selection or installments)
  const session = await db.whatsAppSession.findUnique({ where: { phone } });

  if (session) {
    return handleSession(session, normalizedText, phone, userId);
  }

  // Parse new transaction
  const parsed = parseMessage(text);

  if (!parsed || !parsed.amount) {
    await sendWhatsApp(
      phone,
      `Nao entendi. Tente assim:\n*gastei 50 alimentacao pix*\n\nDigite *ajuda* para ver os comandos.`,
    );
    return NextResponse.json({ received: true });
  }

  if (!parsed.category) {
    await sendWhatsApp(
      phone,
      `Qual a categoria?\n\n1. Moradia\n2. Transporte\n3. Alimentacao\n4. Entretenimento\n5. Saude\n6. Utilidades\n7. Salario\n8. Educacao\n9. Outros\n\nResponda com o numero ou nome.`,
    );
    const pendingData: Prisma.JsonObject = {
      type: parsed.type ?? "EXPENSE",
      amount: parsed.amount!,
    };
    if (parsed.paymentMethod) pendingData.paymentMethod = parsed.paymentMethod;
    await db.whatsAppSession.upsert({
      where: { phone },
      create: { phone, step: "CATEGORY", pendingData },
      update: { step: "CATEGORY", pendingData },
    });
    return NextResponse.json({ received: true });
  }

  if (!parsed.paymentMethod) {
    await sendWhatsApp(
      phone,
      `Qual o metodo de pagamento?\n\n1. Pix\n2. Credito\n3. Debito\n4. Dinheiro\n5. Transferencia\n6. Boleto\n7. Outros\n\nResponda com o numero ou nome.`,
    );
    const pendingData: Prisma.JsonObject = {
      type: parsed.type ?? "EXPENSE",
      amount: parsed.amount!,
      category: parsed.category!,
    };
    await db.whatsAppSession.upsert({
      where: { phone },
      create: { phone, step: "PAYMENT_METHOD", pendingData },
      update: { step: "PAYMENT_METHOD", pendingData },
    });
    return NextResponse.json({ received: true });
  }

  // If credit card, ask which card
  if (parsed.paymentMethod === "CREDIT_CARD") {
    const cards = await db.creditCard.findMany({ where: { userId } });
    if (cards.length === 0) {
      await sendWhatsApp(
        phone,
        "Voce nao tem cartoes de credito cadastrados. Cadastre um cartao no app primeiro.",
      );
      return NextResponse.json({ received: true });
    }

    const cardList = cards
      .map((c, i) => `${i + 1}. ${c.name} (${c.brand} ****${c.lastFourDigits})`)
      .join("\n");

    await sendWhatsApp(
      phone,
      `Qual cartao de credito?\n\n${cardList}\n\nResponda com o numero.`,
    );

    const cardPendingData: Prisma.JsonObject = {
      type: parsed.type ?? "EXPENSE",
      amount: parsed.amount!,
      category: parsed.category!,
      paymentMethod: parsed.paymentMethod!,
      cardIds: cards.map((c) => c.id),
      cardNames: cards.map((c) => `${c.name} (****${c.lastFourDigits})`),
    };
    await db.whatsAppSession.upsert({
      where: { phone },
      create: { phone, step: "SELECT_CARD", pendingData: cardPendingData },
      update: { step: "SELECT_CARD", pendingData: cardPendingData },
    });
    return NextResponse.json({ received: true });
  }

  // Create transaction directly
  await createTransaction(userId, {
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    paymentMethod: parsed.paymentMethod,
  }, phone);

  return NextResponse.json({ received: true });
}

const CATEGORY_BY_NUMBER: Record<string, TransactionCategory> = {
  "1": "HOUSING",
  "2": "TRANSPORTATION",
  "3": "FOOD",
  "4": "ENTERTAINMENT",
  "5": "HEALTH",
  "6": "UTILITY",
  "7": "SALARY",
  "8": "EDUCATION",
  "9": "OTHER",
};

const PAYMENT_BY_NUMBER: Record<string, TransactionPaymentMethod> = {
  "1": "PIX",
  "2": "CREDIT_CARD",
  "3": "DEBIT_CARD",
  "4": "CASH",
  "5": "BANK_TRANSFER",
  "6": "BANK_SLIP",
  "7": "OTHER",
};

async function handleSession(
  session: { id: string; phone: string; pendingData: unknown; step: string },
  text: string,
  phone: string,
  userId: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = session.pendingData as any;

  if (session.step === "CATEGORY") {
    const category =
      CATEGORY_BY_NUMBER[text] || CATEGORY_MAP[text];
    if (!category) {
      await sendWhatsApp(phone, "Nao entendi. Responda com o numero (1-9) ou o nome da categoria.");
      return NextResponse.json({ received: true });
    }
    data.category = category;

    if (!data.paymentMethod) {
      await db.whatsAppSession.update({
        where: { phone },
        data: { step: "PAYMENT_METHOD", pendingData: data as Prisma.JsonObject },
      });
      await sendWhatsApp(
        phone,
        `Qual o metodo de pagamento?\n\n1. Pix\n2. Credito\n3. Debito\n4. Dinheiro\n5. Transferencia\n6. Boleto\n7. Outros`,
      );
      return NextResponse.json({ received: true });
    }

    if (data.paymentMethod === "CREDIT_CARD") {
      return startCardSelection(phone, userId, data);
    }

    await deleteSession(phone);
    await createTransaction(userId, data, phone);
    return NextResponse.json({ received: true });
  }

  if (session.step === "PAYMENT_METHOD") {
    const method =
      PAYMENT_BY_NUMBER[text] || PAYMENT_MAP[text];
    if (!method) {
      await sendWhatsApp(phone, "Nao entendi. Responda com o numero (1-7) ou o nome do metodo.");
      return NextResponse.json({ received: true });
    }
    data.paymentMethod = method;

    if (method === "CREDIT_CARD") {
      return startCardSelection(phone, userId, data);
    }

    await deleteSession(phone);
    await createTransaction(userId, data, phone);
    return NextResponse.json({ received: true });
  }

  if (session.step === "SELECT_CARD") {
    const cardIds = data.cardIds as string[];
    const cardNames = data.cardNames as string[];
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= cardIds.length) {
      await sendWhatsApp(
        phone,
        `Responda com o numero do cartao (1-${cardIds.length}).`,
      );
      return NextResponse.json({ received: true });
    }

    data.creditCardId = cardIds[index];
    data.creditCardName = cardNames[index];

    await db.whatsAppSession.update({
      where: { phone },
      data: {
        step: "INSTALLMENTS",
        pendingData: data as Prisma.JsonObject,
      },
    });

    await sendWhatsApp(
      phone,
      `Cartao: *${cardNames[index]}*\n\nQuantas parcelas? (1-48)\nResponda *1* para pagamento a vista.`,
    );
    return NextResponse.json({ received: true });
  }

  if (session.step === "INSTALLMENTS") {
    const installments = parseInt(text);
    if (isNaN(installments) || installments < 1 || installments > 48) {
      await sendWhatsApp(phone, "Numero invalido. Informe entre 1 e 48 parcelas.");
      return NextResponse.json({ received: true });
    }

    data.installments = installments;
    await deleteSession(phone);
    await createTransaction(userId, data, phone);
    return NextResponse.json({ received: true });
  }

  // Unknown step, clean up
  await deleteSession(phone);
  await sendWhatsApp(phone, "Algo deu errado. Tente novamente.");
  return NextResponse.json({ received: true });
}

async function startCardSelection(
  phone: string,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
) {
  const cards = await db.creditCard.findMany({ where: { userId } });
  if (cards.length === 0) {
    await deleteSession(phone);
    await sendWhatsApp(
      phone,
      "Voce nao tem cartoes de credito cadastrados. Cadastre no app primeiro.",
    );
    return NextResponse.json({ received: true });
  }

  const cardList = cards
    .map((c, i) => `${i + 1}. ${c.name} (${c.brand} ****${c.lastFourDigits})`)
    .join("\n");

  const pendingData: Prisma.JsonObject = {
    ...data,
    cardIds: cards.map((c) => c.id),
    cardNames: cards.map((c) => `${c.name} (****${c.lastFourDigits})`),
  };

  await db.whatsAppSession.upsert({
    where: { phone },
    create: { phone, step: "SELECT_CARD", pendingData },
    update: { step: "SELECT_CARD", pendingData },
  });

  await sendWhatsApp(
    phone,
    `Qual cartao de credito?\n\n${cardList}\n\nResponda com o numero.`,
  );
  return NextResponse.json({ received: true });
}

async function deleteSession(phone: string) {
  await db.whatsAppSession.delete({ where: { phone } }).catch(() => {});
}

async function createTransaction(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  phone: string,
) {
  const type = data.type as TransactionType;
  const amount = data.amount as number;
  const category = data.category as TransactionCategory;
  const paymentMethod = data.paymentMethod as TransactionPaymentMethod;
  const creditCardId = data.creditCardId as string | undefined;
  const installments = (data.installments as number) || 1;
  const creditCardName = data.creditCardName as string | undefined;

  const name = `${TYPE_LABELS[type]} - ${CATEGORY_LABELS[category]} (WhatsApp)`;

  try {
    if (paymentMethod === "CREDIT_CARD" && installments > 1 && creditCardId) {
      // Create installment transactions
      const installmentAmount = Math.round((amount / installments) * 100) / 100;
      const now = new Date();

      for (let i = 0; i < installments; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
        await db.transaction.create({
          data: {
            name,
            type,
            amount: installmentAmount,
            category,
            paymentMethod,
            date,
            userId,
            creditCardId,
            installments,
            installmentNumber: i + 1,
          },
        });
      }

      const installmentAmount2 = (amount / installments).toFixed(2);
      await sendWhatsApp(
        phone,
        `*Transacao registrada!*\n\n` +
          `${TYPE_LABELS[type]}: *R$ ${amount.toFixed(2)}*\n` +
          `Categoria: ${CATEGORY_LABELS[category]}\n` +
          `Cartao: ${creditCardName}\n` +
          `Parcelado: *${installments}x de R$ ${installmentAmount2}*\n` +
          `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      );
    } else {
      await db.transaction.create({
        data: {
          name,
          type,
          amount,
          category,
          paymentMethod,
          date: new Date(),
          userId,
          creditCardId: creditCardId || null,
          installments: 1,
          installmentNumber: 1,
        },
      });

      await sendWhatsApp(
        phone,
        `*Transacao registrada!*\n\n` +
          `${TYPE_LABELS[type]}: *R$ ${amount.toFixed(2)}*\n` +
          `Categoria: ${CATEGORY_LABELS[category]}\n` +
          `Pagamento: ${PAYMENT_LABELS[paymentMethod]}` +
          (creditCardName ? `\nCartao: ${creditCardName}` : "") +
          `\nData: ${new Date().toLocaleDateString("pt-BR")}`,
      );
    }
  } catch (err) {
    console.error("WhatsApp transaction creation failed:", err);
    await sendWhatsApp(phone, "Erro ao registrar transacao. Tente novamente.");
  }
}
