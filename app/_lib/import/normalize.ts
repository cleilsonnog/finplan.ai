// Statement descriptions are noisy ("COMPRA CARTAO DEB MERCADO GOMES 05/10 SAO PAULO BR").
// normalizeMerchant reduces them to the stable merchant part, used as the key for learned
// category rules and for matching against the user's history.

const NOISE_PREFIXES = [
  "compra cartao debito",
  "compra cartao credito",
  "compra cartao deb",
  "compra cartao",
  "compra no debito",
  "compra debito",
  "compra credito",
  "pagamento efetuado",
  "pix enviado",
  "pix recebido",
  "pix transf",
  "transferencia enviada",
  "transferencia recebida",
  "ted enviada",
  "ted recebida",
  "deb aut",
  "debito automatico",
  "pag boleto",
  "pagamento boleto",
  "pagamento de boleto",
  "pagamento",
  "compra",
];

// Payment processors that prefix the real merchant: "PAG*JOSESILVA", "MP *LOJA", "IFD*IFOOD"
const PROCESSOR_PREFIX = /^(pag|mp|pg|ifd|ec|sumup|stone|cielo|pagseguro|ps|pp|hna|ebn|dm)\s*\*\s*/;

// City/country tails some cards append: "... SAO PAULO BR", "... RIO DE JANEIR BRA"
const LOCATION_SUFFIX = /\s+(br|bra|brasil)$/;

export const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const normalizeMerchant = (description: string) => {
  let s = stripAccents(description.toLowerCase()).trim();
  s = s.replace(PROCESSOR_PREFIX, "");
  for (const prefix of NOISE_PREFIXES) {
    if (s.startsWith(prefix + " ")) {
      s = s.slice(prefix.length);
      break;
    }
  }
  s = s
    .replace(/parc(ela)?\.?\s*\d+\s*(de|\/)\s*\d+/g, " ") // before dates: "parc 03/12"
    .replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, " ") // dates and "05/10" installments
    .replace(/[^a-z\s]/g, " ") // digits, punctuation, asterisks
    .replace(/\s+/g, " ")
    .trim()
    .replace(LOCATION_SUFFIX, "")
    .trim();
  // The first words carry the merchant; long tails are usually city / terminal ids
  return s.split(" ").filter((w) => w.length > 1).slice(0, 4).join(" ");
};

/** "NETSHOES 05/10", "AMAZON PARC 03/12", "LOJA PARCELA 2 DE 6" → { number, total } */
export const parseInstallment = (description: string) => {
  const m =
    /(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})(?!\d)/i.exec(description);
  if (!m) return undefined;
  const number = Number(m[1]);
  const total = Number(m[2]);
  // Avoid matching dates like "15/09": installments have number <= total and total >= 2
  if (total < 2 || number < 1 || number > total || total > 48) return undefined;
  return { number, total };
};

/** Short, readable name for the transaction, e.g. "Mercado Gomes" */
export const displayName = (description: string) => {
  const merchant = normalizeMerchant(description);
  const base = merchant || description.trim().toLowerCase();
  return base
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 60);
};
