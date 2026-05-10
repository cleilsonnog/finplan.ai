import { BillStatus, CardBrand } from "@prisma/client";

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
