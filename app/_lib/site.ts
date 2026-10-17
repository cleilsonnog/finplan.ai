// Single source for the public URL (metadata, robots, sitemap, structured data)
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://finplanai.com.br").replace(/\/$/, "");

export const SITE_TITLE = "FinPlan.ai — Controle financeiro com importação de extrato, cartão e WhatsApp";
export const SITE_DESCRIPTION =
  "App de finanças pessoais: importe o extrato e a fatura do cartão em PDF, registre gastos por texto ou áudio no WhatsApp e veja quanto vai sobrar nos próximos meses. Grátis para começar.";
