"use client";

import { SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import {
  ArrowRightIcon,
  BellRingIcon,
  BrainCircuitIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  CreditCardIcon,
  FileUpIcon,
  FlameIcon,
  LockIcon,
  MessageCircleIcon,
  MicIcon,
  PiggyBankIcon,
  QrCodeIcon,
  RepeatIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import WhatsAppFloatButton from "@/app/_components/whatsapp-float-button";
import { SITE_DESCRIPTION, SITE_URL } from "@/app/_lib/site";

const WHATSAPP_URL =
  "https://wa.me/5522988516223?text=Ol%C3%A1%2C%20vim%20pelo%20FinPlan.ai%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!";

// ---------------------------------------------------------------------------------------------
// Product previews — drawn in code with example data, so they match the real app in both
// themes and never go stale like screenshots.
// ---------------------------------------------------------------------------------------------

const PreviewFrame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border bg-background p-4 shadow-2xl shadow-black/20 ${className}`}>
    {children}
  </div>
);

const PROJECTION = [
  { label: "Nov", value: 1240 },
  { label: "Dez", value: 860 },
  { label: "Jan", value: -320 },
  { label: "Fev", value: 410 },
  { label: "Mar", value: 980 },
  { label: "Abr", value: 1350 },
];

const ProjectionPreview = () => {
  const max = Math.max(...PROJECTION.map((p) => Math.abs(p.value)));
  return (
    <PreviewFrame>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Próximos meses</p>
          <p className="text-[11px] text-muted-foreground">Sobra prevista depois de contas, faturas e dia a dia</p>
        </div>
        <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">Exemplo</span>
      </div>
      <div className="relative flex h-32 items-center gap-2">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        {PROJECTION.map((p) => (
          <div key={p.label} className="relative flex h-full flex-1 flex-col items-center justify-center">
            <div className="flex h-1/2 w-full items-end justify-center">
              {p.value > 0 && (
                <div
                  className="w-full max-w-[22px] rounded-t-md bg-[var(--viz-income)]"
                  style={{ height: `${(p.value / max) * 100}%` }}
                />
              )}
            </div>
            <div className="flex h-1/2 w-full items-start justify-center">
              {p.value < 0 && (
                <div
                  className="w-full max-w-[22px] rounded-b-md bg-[var(--viz-expense)]"
                  style={{ height: `${(-p.value / max) * 100}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {PROJECTION.map((p) => (
          <span key={p.label} className="flex-1 text-center text-[10px] text-muted-foreground">{p.label}</span>
        ))}
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-[11px]">
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--viz-expense)]" />
        Janeiro fecha no vermelho — melhor adiar a compra parcelada.
      </p>
    </PreviewFrame>
  );
};

const WhatsAppPreview = () => (
  <PreviewFrame className="w-full max-w-[290px]">
    <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white">
        <MessageCircleIcon size={14} />
      </div>
      <p className="text-xs font-semibold">FinPlan.ai no WhatsApp</p>
    </div>
    <div className="space-y-2 text-[11px]">
      <div className="ml-auto flex w-fit max-w-[85%] items-center gap-2 rounded-xl rounded-tr-sm bg-[#25D366]/15 px-3 py-2">
        <MicIcon size={12} className="shrink-0 text-[#25D366]" />
        <span>&ldquo;gastei 84 no mercado no débito&rdquo;</span>
      </div>
      <div className="w-fit max-w-[90%] rounded-xl rounded-tl-sm bg-muted px-3 py-2">
        <p className="font-semibold">Transação registrada!</p>
        <p className="text-muted-foreground">Despesa: R$ 84,00 · Alimentação · Débito</p>
      </div>
      <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-[#25D366]/15 px-3 py-2">
        comprar arroz, café, leite
      </div>
      <div className="w-fit max-w-[90%] rounded-xl rounded-tl-sm bg-muted px-3 py-2">
        <p className="font-semibold">Adicionados à lista</p>
        <p className="text-muted-foreground">arroz, café, leite</p>
      </div>
    </div>
  </PreviewFrame>
);

const IMPORT_ROWS = [
  { name: "Mercado Super Líder", category: "Alimentação", source: "Seu histórico", value: "48,03", tone: "ok" },
  { name: "Posto Bellas", category: "Transporte", source: "Automático", value: "50,00", tone: "ok" },
  { name: "Netflix", category: "Entretenimento", source: "IA", value: "44,90", tone: "ai" },
  { name: "Drogaria Raia", category: "Saúde", source: "Já lançada", value: "34,11", tone: "dup" },
] as const;

const ImportPreview = () => (
  <PreviewFrame>
    <div className="mb-3 flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold">Revise antes de salvar</p>
        <p className="text-[11px] text-muted-foreground">fatura-outubro.pdf · 203 lançamentos</p>
      </div>
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2Icon size={11} /> Total confere com a fatura
      </span>
    </div>
    <div className="space-y-1.5">
      {IMPORT_ROWS.map((r) => (
        <div
          key={r.name}
          className={`flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-xs ${r.tone === "dup" ? "opacity-50" : ""}`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
              r.tone === "dup" ? "border border-border" : "bg-primary text-primary-foreground"
            }`}
          >
            {r.tone !== "dup" && <CheckIcon size={11} />}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
          <span className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] sm:inline">{r.category}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              r.tone === "ai"
                ? "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                : r.tone === "dup"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {r.source}
          </span>
          <span className="w-16 text-right tabular-nums">R$ {r.value}</span>
        </div>
      ))}
    </div>
  </PreviewFrame>
);

const CardPreview = () => (
  <PreviewFrame>
    <div className="mb-3 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <CreditCardIcon size={16} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">Cartão Principal</p>
        <p className="text-[11px] text-muted-foreground">•••• 1234</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <p className="text-muted-foreground">Vence em outubro</p>
        <p className="text-base font-semibold">R$ 2.418,90</p>
        <span className="mt-1 inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
          Paga
        </span>
      </div>
      <div>
        <p className="text-muted-foreground">Próxima fatura</p>
        <p className="text-base font-semibold">R$ 1.106,40</p>
        <p className="mt-1 text-[10px] text-muted-foreground">fecha 29 out · vence 6 nov</p>
      </div>
    </div>
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--viz-track)]">
      <div className="h-full w-[38%] rounded-full bg-[var(--viz-card)]" />
    </div>
    <p className="mt-1.5 text-[10px] text-muted-foreground">38% do limite · parcelas futuras incluídas</p>
    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-[11px]">
      <p className="mb-1 flex items-center gap-1.5 font-semibold">
        <CalculatorIcon size={12} /> Posso parcelar?
      </p>
      <p className="text-muted-foreground">
        Notebook R$ 3.600 em 10x de R$ 360 —{" "}
        <span className="font-medium text-emerald-700 dark:text-emerald-400">cabe: a pior sobra fica em R$ 410.</span>
      </p>
    </div>
  </PreviewFrame>
);

const ReportPreview = () => (
  <PreviewFrame>
    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
      <SparklesIcon size={14} className="text-primary" /> Relatório do mês
    </p>
    <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--viz-income)] text-sm font-bold">
        72
      </div>
      <div className="text-xs">
        <p className="font-semibold">Saúde financeira: boa</p>
        <p className="text-muted-foreground">Você gastou 18% menos com delivery que a média dos últimos 3 meses.</p>
      </div>
    </div>
    <ul className="space-y-1.5 text-[11px]">
      {[
        "Alimentação passou do orçamento em R$ 140 — 3 compras grandes no fim do mês",
        "Assinatura duplicada de streaming: dá para economizar R$ 22/mês",
        "Prioridade: quitar a parcela maior antes de nova compra no cartão",
      ].map((t) => (
        <li key={t} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="text-muted-foreground">{t}</span>
        </li>
      ))}
    </ul>
  </PreviewFrame>
);

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

const TRUST = [
  { icon: FileUpIcon, text: "Funciona com qualquer banco (PDF ou OFX)" },
  { icon: LockIcon, text: "Nunca pedimos a senha do seu banco" },
  { icon: QrCodeIcon, text: "Pague com Pix ou cartão" },
  { icon: SmartphoneIcon, text: "Instala no celular como app" },
];

const WAYS = [
  {
    icon: FileUpIcon,
    title: "Importe o extrato",
    text: "Chegou o fim de semana sem lançar nada? Envie o PDF da fatura ou do extrato e tudo entra categorizado — você só revisa.",
  },
  {
    icon: MicIcon,
    title: "Mande no WhatsApp",
    text: "“Gastei 50 no posto no crédito.” Por texto ou áudio, na hora da compra, sem abrir app nenhum.",
  },
  {
    icon: SmartphoneIcon,
    title: "Ou use o app",
    text: "Lançamento rápido no celular ou no computador, com parcelas, cartões e categorias suas.",
  },
];

const SPOTLIGHTS = [
  {
    eyebrow: "Importação inteligente",
    title: "Do PDF do banco para o app em segundos",
    text: "O FinPlan lê a fatura do cartão e o extrato da conta, separa compras, parcelas e estornos, e confere o total com o que o banco cobrou.",
    points: [
      "Categoria automática pelo seu próprio histórico — e ele aprende com suas correções",
      "Reconhece o que você já tinha lançado e não duplica",
      "Pix entre suas contas e pagamento de fatura não viram despesa",
    ],
    preview: <ImportPreview />,
  },
  {
    eyebrow: "Cartão de crédito sob controle",
    title: "Saiba quanto vem na fatura antes dela chegar",
    text: "Fatura do mês, próxima fatura, parcelas futuras e uso do limite de cada cartão — com a data real de fechamento do seu banco.",
    points: [
      "Simulador “Posso parcelar?” mostra o impacto nos próximos meses",
      "Cartões adicionais identificados (cônjuge, cartão virtual)",
      "A fatura só sai do saldo quando você paga — como na sua conta",
    ],
    preview: <CardPreview />,
  },
  {
    eyebrow: "Previsão",
    title: "Veja o vermelho antes de entrar nele",
    text: "Receitas, contas fixas, faturas já comprometidas e o seu gasto médio do dia a dia viram uma previsão dos próximos 6 meses.",
    points: [
      "Alerta quando um mês vai fechar negativo",
      "Aviso quando o cartão passa de 30% da sua renda",
      "Decida compras grandes com números, não no impulso",
    ],
    preview: <ProjectionPreview />,
  },
  {
    eyebrow: "Inteligência artificial",
    title: "Um relatório que diz o que fazer",
    text: "Análise do seu mês com saúde financeira, tendências por categoria, gastos fora do padrão e um plano de ação priorizado.",
    points: [
      "Compara com os últimos 3 meses",
      "Orçamento versus realidade, categoria por categoria",
      "Sugestões práticas, em português claro",
    ],
    preview: <ReportPreview />,
  },
];

const MORE = [
  { icon: PiggyBankIcon, title: "Orçamento por categoria", text: "Limites mensais e acompanhamento em tempo real." },
  { icon: RepeatIcon, title: "Contas fixas", text: "Aluguel, luz, internet: marque como paga e veja o que falta." },
  { icon: BellRingIcon, title: "Lembretes", text: "Vencimentos por WhatsApp e notificação no celular." },
  { icon: ShoppingCartIcon, title: "Lista de compras", text: "Monte pelo WhatsApp ou app e use no mercado." },
  { icon: UsersIcon, title: "Conta compartilhada", text: "Organize as finanças da casa a dois, em tempo real." },
  { icon: TrendingUpIcon, title: "Dashboard completo", text: "Saldo, gastos do mês, destino da receita e tendências." },
];

const STEPS = [
  { title: "Crie sua conta grátis", text: "Leva segundos e não pede cartão de crédito." },
  { title: "Traga seus gastos", text: "Importe o extrato, mande no WhatsApp ou lance pelo app." },
  { title: "Decida com clareza", text: "Veja para onde vai o dinheiro e quanto vai sobrar nos próximos meses." },
];

const FREE_FEATURES = [
  "Até 15 lançamentos manuais por mês",
  "1 importação de extrato/fatura por mês (até 50 lançamentos)",
  "Dashboard, cartões e previsão de 6 meses",
  "Orçamento por categoria e contas fixas",
  "Lista de compras",
];

const PREMIUM_FEATURES = [
  "Lançamentos e importações ilimitados",
  "WhatsApp por texto e voz",
  "Relatórios com IA",
  "Lembretes por WhatsApp e notificação",
  "Conta compartilhada e categorias personalizadas",
  "Tudo do plano grátis",
];

const FAQ = [
  {
    q: "Funciona com o meu banco?",
    a: "Sim. Você importa o PDF da fatura do cartão ou o extrato da conta (PDF ou OFX) que baixa no app do seu banco. A leitura foi pensada para os formatos dos bancos brasileiros e o app sempre confere o total lido com o total do documento.",
  },
  {
    q: "Preciso informar a senha do banco?",
    a: "Não. O FinPlan nunca se conecta à sua conta bancária nem pede senha. Você decide o que enviar, e revisa tudo antes de salvar.",
  },
  {
    q: "Como a inteligência artificial usa meus dados?",
    a: "A IA é usada para ler PDFs que o app não reconhece sozinho, sugerir categorias para estabelecimentos desconhecidos e gerar o relatório mensal. Número de conta e agência não são enviados.",
  },
  {
    q: "Posso usar de graça?",
    a: "Sim. O plano grátis não expira e inclui dashboard, cartões, previsão, orçamento e uma importação por mês. O Premium libera uso ilimitado, WhatsApp e relatórios com IA.",
  },
  {
    q: "Como funciona o pagamento e o cancelamento?",
    a: "O Premium mensal é cobrado no cartão de crédito. Para cancelar, é só falar com a gente pelo WhatsApp. O acesso vitalício é um pagamento único, por Pix ou cartão.",
  },
  {
    q: "Dá para usar no celular?",
    a: "Sim. O FinPlan funciona no navegador e pode ser instalado como app no Android e no iPhone, com notificações de vencimento.",
  },
];

// Structured data for search engines: what the product is, its plans, and the FAQ shown below
const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FinPlan.ai",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: "pt-BR",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: [
      { "@type": "Offer", name: "Grátis", price: "0", priceCurrency: "BRL" },
      { "@type": "Offer", name: "Premium mensal", price: "14.99", priceCurrency: "BRL" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

const CTAButton = ({ children = "Começar grátis", variant = "default" }: { children?: string; variant?: "default" | "outline" }) => (
  <SignInButton mode="modal">
    <Button size="lg" variant={variant} className="w-full rounded-full px-7 text-base font-semibold sm:w-auto">
      {children}
      {variant === "default" && <ArrowRightIcon className="ml-2 h-5 w-5" />}
    </Button>
  </SignInButton>
);

const SectionTitle = ({ eyebrow, title, text }: { eyebrow?: string; title: React.ReactNode; text?: string }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
    {text && <p className="mt-4 text-muted-foreground">{text}</p>}
  </div>
);

const LandingPage = () => {
  return (
    <div className="flex min-h-full flex-col">
      <script
        type="application/ld+json"
        // Static content defined in this file — no user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <a href="#" className="flex items-center gap-2">
            <Image src="/icon-finplanai-pwa.svg" width={32} height={32} alt="FinPlan AI" />
            <span className="text-lg font-bold">FinPlan.ai</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#funcionalidades" className="hover:text-foreground">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-foreground">Como funciona</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <a href="#duvidas" className="hover:text-foreground">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button size="sm" variant="ghost">Entrar</Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button size="sm" className="hidden rounded-full sm:inline-flex">Começar grátis</Button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr,1fr]">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <SparklesIcon size={14} /> Novo: importe a fatura do cartão em PDF
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Saiba hoje se vai <span className="text-primary">sobrar dinheiro</span> no fim do mês.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
              Importe o extrato do banco, registre gastos por mensagem ou áudio no WhatsApp e veja a previsão dos
              próximos meses — com o cartão de crédito finalmente sob controle.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <CTAButton />
              <a href="#funcionalidades" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full rounded-full px-7 text-base font-semibold sm:w-auto">
                  Ver como funciona
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Grátis para sempre no plano básico. Sem cartão de crédito.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md sm:pb-56 lg:max-w-none">
            <div className="sm:ml-auto sm:w-[84%]">
              <ProjectionPreview />
            </div>
            <div className="absolute bottom-0 left-0 hidden w-[260px] sm:block lg:-left-8">
              <WhatsAppPreview />
            </div>
            <div className="absolute -right-2 -top-5 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-lg">
              <CheckCircle2Icon size={14} className="text-emerald-500" /> Fatura importada · 203 lançamentos
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:px-8 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.text} className="flex items-center gap-3 text-sm">
              <t.icon className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-muted-foreground">{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WAYS TO RECORD */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <SectionTitle
          eyebrow="Sem planilha, sem esforço"
          title="Três jeitos de registrar. Escolha o seu."
          text="O que trava o controle financeiro é lançar gasto por gasto. Aqui você não precisa."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {WAYS.map((w) => (
            <div key={w.title} className="rounded-2xl border border-border bg-muted/40 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <w.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{w.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{w.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center sm:hidden">
          <WhatsAppPreview />
        </div>
      </section>

      {/* SPOTLIGHTS */}
      <section id="funcionalidades" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl space-y-24 px-4 py-16 sm:px-8 sm:py-24">
          {SPOTLIGHTS.map((s, i) => (
            <div key={s.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">{s.eyebrow}</p>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{s.title}</h3>
                <p className="mt-4 text-muted-foreground">{s.text}</p>
                <ul className="mt-6 space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm">
                      <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>{s.preview}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MORE FEATURES */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <SectionTitle title="E tudo o que você espera de um app de finanças" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MORE.map((m) => (
            <div key={m.title} className="flex gap-4 rounded-2xl border border-border p-5 transition-colors hover:border-primary/30 hover:bg-primary/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <SectionTitle eyebrow="Como funciona" title="Comece em 3 passos" />
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-border bg-background p-6">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <CTAButton>Criar minha conta grátis</CTAButton>
          </div>
        </div>
      </section>

      {/* LIFETIME OFFER */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-background p-8 sm:p-12">
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground">
            Oferta de lançamento
          </div>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
                <FlameIcon className="h-7 w-7 text-orange-500" /> Acesso vitalício
              </h2>
              <p className="text-lg text-muted-foreground">
                Os 100 primeiros usuários garantem todo o Premium para sempre, pagando o valor de uma mensalidade.
              </p>
              <ul className="space-y-2 text-sm">
                {["Tudo do Premium incluso", "Pagamento único, sem mensalidade", "Acesso permanente a todas as funcionalidades"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" /> {t}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Vagas limitadas aos primeiros 100 usuários.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl text-muted-foreground">R$</span>
                  <span className="text-6xl font-bold text-primary">14,99</span>
                </div>
                <span className="text-sm text-muted-foreground">pagamento único · Pix ou cartão</span>
              </div>
              <CTAButton>Garantir acesso vitalício</CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <SectionTitle eyebrow="Planos" title="Comece grátis. Evolua quando quiser." />
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-border bg-background p-7">
              <h3 className="text-xl font-bold">Grátis</h3>
              <p className="mt-1 text-sm text-muted-foreground">Para organizar o básico</p>
              <p className="my-6 text-4xl font-extrabold">
                R$ 0<span className="text-base font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <CTAButton variant="outline">Começar grátis</CTAButton>
            </div>
            <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-primary/5 p-7 shadow-xl shadow-primary/10">
              <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Mais completo
              </span>
              <h3 className="text-xl font-bold">Premium</h3>
              <p className="mt-1 text-sm text-muted-foreground">Para quem quer controle de verdade</p>
              <p className="my-6 text-4xl font-extrabold">
                R$ 14,99<span className="text-base font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <CTAButton>Assinar Premium</CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-8 sm:py-24">
        <SectionTitle eyebrow="Dúvidas" title="Perguntas frequentes" />
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-border bg-muted/30 px-5 py-4 open:bg-muted/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-[-30%] left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
          <BrainCircuitIcon className="mx-auto mb-5 h-10 w-10 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Assuma o controle do seu dinheiro hoje</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Crie sua conta em segundos e descubra quanto vai sobrar nos próximos meses.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTAButton>Criar conta grátis</CTAButton>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full rounded-full px-7 text-base font-semibold sm:w-auto">
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <Image src="/icon-finplanai-pwa.svg" width={24} height={24} alt="FinPlan AI" />
            <span className="text-sm font-semibold">FinPlan.ai</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FinPlan.ai. Todos os direitos reservados.
          </p>
        </div>
      </footer>
      <WhatsAppFloatButton />
    </div>
  );
};

export default LandingPage;
