import { BillStatus, CardBrand } from "@prisma/client";

export const CARD_COLORS = [
  { value: "blue", label: "Azul", gradient: "from-blue-900/80 to-blue-700/40", swatch: "bg-blue-600" },
  { value: "purple", label: "Roxo", gradient: "from-purple-900/80 to-purple-700/40", swatch: "bg-purple-600" },
  { value: "emerald", label: "Verde", gradient: "from-emerald-900/80 to-emerald-700/40", swatch: "bg-emerald-600" },
  { value: "red", label: "Vermelho", gradient: "from-red-900/80 to-red-700/40", swatch: "bg-red-600" },
  { value: "amber", label: "Amarelo", gradient: "from-amber-900/80 to-amber-700/40", swatch: "bg-amber-600" },
] as const;

export type CardColor = (typeof CARD_COLORS)[number]["value"];

export const CARD_COLOR_GRADIENTS: Record<string, string> = Object.fromEntries(
  CARD_COLORS.map((c) => [c.value, c.gradient]),
);

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
  OVERDUE: "Atrasada",
};

export const CARD_BRAND_LABELS = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  ELO: "Elo",
  AMEX: "American Express",
  HIPERCARD: "Hipercard",
  OTHER: "Outra",
};

export const CARD_BRAND_ICONS: Record<string, string> = {
  VISA: "/brands/visa.svg",
  MASTERCARD: "/brands/mastercard.svg",
  ELO: "/brands/elo.svg",
  AMEX: "/brands/amex.svg",
  HIPERCARD: "/brands/hipercard.svg",
};

export const BANK_ICONS: Record<string, string> = {
  nubank: "/banks/nubank.svg",
  santander: "/banks/santander.svg",
  itau: "/banks/itau.svg",
  "itaú": "/banks/itau.svg",
  bradesco: "/banks/bradesco.svg",
  inter: "/banks/inter.svg",
  "mercado pago": "/banks/mercadopago.svg",
  mercadopago: "/banks/mercadopago.svg",
  "banco do brasil": "/banks/bb.svg",
  bb: "/banks/bb.svg",
  caixa: "/banks/caixa.svg",
  c6: "/banks/c6.svg",
  "c6 bank": "/banks/c6.svg",
  pan: "/banks/pan.svg",
};

export function getBankIcon(bank: string): string | undefined {
  return BANK_ICONS[bank.toLowerCase().trim()];
}

export const CARD_BRAND_OPTIONS = [
  {
    value: CardBrand.VISA,
    label: CARD_BRAND_LABELS[CardBrand.VISA],
  },
  {
    value: CardBrand.MASTERCARD,
    label: CARD_BRAND_LABELS[CardBrand.MASTERCARD],
  },
  {
    value: CardBrand.ELO,
    label: CARD_BRAND_LABELS[CardBrand.ELO],
  },
  {
    value: CardBrand.AMEX,
    label: CARD_BRAND_LABELS[CardBrand.AMEX],
  },
  {
    value: CardBrand.HIPERCARD,
    label: CARD_BRAND_LABELS[CardBrand.HIPERCARD],
  },
  {
    value: CardBrand.OTHER,
    label: CARD_BRAND_LABELS[CardBrand.OTHER],
  },
];
