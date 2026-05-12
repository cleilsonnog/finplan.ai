"use client";

import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import WhatsAppFloatButton from "@/app/_components/whatsapp-float-button";
import {
  ArrowRightIcon,
  BarChart3Icon,
  BrainCircuitIcon,
  CreditCardIcon,
  FlameIcon,
  PiggyBankIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UsersIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react";

const FEATURES = [
  {
    icon: WalletIcon,
    title: "Controle de Transações",
    description:
      "Registre receitas, despesas e investimentos com categorias personalizadas e múltiplos métodos de pagamento.",
  },
  {
    icon: CreditCardIcon,
    title: "Gestão de Cartões",
    description:
      "Acompanhe faturas, limites, parcelas e status de pagamento de todos os seus cartões de crédito.",
  },
  {
    icon: PiggyBankIcon,
    title: "Orçamentos Inteligentes",
    description:
      "Defina limites por categoria e acompanhe em tempo real se está dentro do planejado.",
  },
  {
    icon: BrainCircuitIcon,
    title: "Relatórios com IA",
    description:
      "Receba análises personalizadas, score financeiro e dicas práticas geradas por inteligência artificial.",
  },
  {
    icon: BarChart3Icon,
    title: "Dashboard Completo",
    description:
      "Visualize suas finanças com gráficos interativos, resumos mensais e tendências de gastos.",
  },
  {
    icon: UsersIcon,
    title: "Conta Compartilhada",
    description:
      "Compartilhe sua conta com parceiro(a) para gestão financeira conjunta em tempo real.",
  },
];

const HIGHLIGHTS = [
  {
    icon: ShieldCheckIcon,
    title: "Seguro",
    description: "Seus dados protegidos com autenticação moderna",
  },
  {
    icon: SmartphoneIcon,
    title: "PWA",
    description: "Instale no celular como um app nativo",
  },
  {
    icon: BrainCircuitIcon,
    title: "IA Integrada",
    description: "Insights financeiros personalizados todo mês",
  },
];

const DESKTOP_SCREENSHOTS = [
  {
    src: "/screenshots/desktop-dashboard.jpeg",
    alt: "Dashboard - Visão geral das finanças",
    label: "Dashboard",
  },
  {
    src: "/screenshots/desktop-transacoes.jpeg",
    alt: "Transações - Controle detalhado",
    label: "Transações",
  },
  {
    src: "/screenshots/desktop-cartoes.jpeg",
    alt: "Cartões de Crédito - Faturas e limites",
    label: "Cartões",
  },
  {
    src: "/screenshots/desktop-orcamento.jpeg",
    alt: "Orçamento - Limites por categoria",
    label: "Orçamento",
  },
];

const LandingPage = () => {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [activeMobile, setActiveMobile] = useState<number | null>(null);
  return (
    <div className="flex min-h-full flex-col">
      {/* NAVBAR */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/icon-finplanai-pwa.svg"
              width={36}
              height={36}
              alt="FinPlan AI"
            />
            <span className="text-lg font-bold">FinPlan.ai</span>
          </div>
          <SignInButton>
            <Button size="sm">Entrar</Button>
          </SignInButton>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-8 sm:py-24">
        <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          Gestão financeira inteligente
        </div>
        <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Planeje hoje. <span className="text-primary">Garanta amanhã.</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Organize suas finanças pessoais e conte com ajuda da inteligência
          artificial. Controle transações, orçamentos, cartões de crédito e
          receba relatórios com insights personalizados.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <SignInButton>
            <Button size="lg" className="text-base font-semibold">
              Começar grátis
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </SignInButton>
          <a href="#funcionalidades">
            <Button
              size="lg"
              variant="outline"
              className="w-full text-base font-semibold sm:w-auto"
            >
              Ver funcionalidades
            </Button>
          </a>
        </div>

        {/* Highlights */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-5 py-3"
            >
              <item.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Veja o <span className="text-primary">FinPlan.ai</span> em ação
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Dashboard completo, transações detalhadas, cartões de crédito e
              orçamentos — tudo em um só lugar.
            </p>
          </div>

          {/* Desktop: imagem principal + miniaturas */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            <Image
              src={DESKTOP_SCREENSHOTS[activeScreenshot].src}
              alt={DESKTOP_SCREENSHOTS[activeScreenshot].alt}
              width={1456}
              height={816}
              className="w-full object-cover"
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {DESKTOP_SCREENSHOTS.map((shot, index) => (
              <button
                key={shot.label}
                onClick={() => setActiveScreenshot(index)}
                className={`overflow-hidden rounded-lg border-2 transition-all ${
                  activeScreenshot === index
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={364}
                  height={204}
                  className="w-full object-cover"
                />
                <p className="bg-background/80 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  {shot.label}
                </p>
              </button>
            ))}
          </div>

          {/* Mobile */}
          <div className="mt-16 flex flex-col items-center gap-6">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <SmartphoneIcon className="mr-2 h-4 w-4" />
                Disponível como PWA
              </div>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                Instale no celular e controle suas finanças de qualquer lugar.
              </p>
            </div>
            <div
              className="flex items-center justify-center gap-4 sm:gap-6"
              onMouseLeave={() => setActiveMobile(null)}
            >
              {[
                {
                  src: "/screenshots/mobile-dashboard.jpeg",
                  alt: "Dashboard no celular",
                },
                {
                  src: "/screenshots/mobile-menu.jpeg",
                  alt: "Menu de navegação mobile",
                },
                {
                  src: "/screenshots/mobile-cartoes.jpeg",
                  alt: "Cartões de crédito no celular",
                },
              ].map((shot, index) => (
                <button
                  key={shot.alt}
                  onClick={() =>
                    setActiveMobile(activeMobile === index ? null : index)
                  }
                  onBlur={(e) => {
                    if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                      setActiveMobile(null);
                    }
                  }}
                  className={`overflow-hidden rounded-2xl border-2 shadow-xl transition-all duration-300 ${
                    activeMobile === index
                      ? "z-10 w-[180px] border-primary shadow-2xl shadow-primary/20 sm:w-[220px] lg:w-[260px]"
                      : "w-[110px] border-white/10 sm:w-[140px] lg:w-[170px]"
                  }`}
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={1080}
                    height={2340}
                    className="w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="funcionalidades"
        className="border-t border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Tudo que você precisa para{" "}
              <span className="text-primary">controlar suas finanças</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ferramentas completas para organizar sua vida financeira, do
              controle diário até relatórios inteligentes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO VITALÍCIO */}
      <section className="border-t border-white/10 bg-gradient-to-b from-green-950/20 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-green-600/50 bg-gradient-to-br from-green-950/40 to-background p-8 sm:p-12">
            <div className="absolute right-0 top-0 rounded-bl-xl bg-green-600 px-4 py-1.5 text-sm font-bold text-white">
              OFERTA DE LANCAMENTO
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <FlameIcon className="h-7 w-7 text-orange-500" />
                  <h2 className="text-2xl font-bold text-green-500 sm:text-3xl">
                    Acesso Vitalicio Launch Edition
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground">
                  Os 100 primeiros usuarios terao acesso vitalicio pagando
                  apenas o valor de 1 mensalidade. Sem recorrencia, pague uma
                  vez e use para sempre.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ZapIcon className="h-4 w-4 text-green-500" />
                    <p className="text-sm">Tudo do plano Premium incluso</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZapIcon className="h-4 w-4 text-green-500" />
                    <p className="text-sm">
                      Pagamento unico — sem mensalidade
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZapIcon className="h-4 w-4 text-green-500" />
                    <p className="text-sm">
                      Acesso permanente a todas as funcionalidades
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Apenas 100 vagas. Oferta valida apenas para os primeiros
                  usuarios.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl text-muted-foreground">R$</span>
                    <span className="text-6xl font-bold text-green-500">
                      14,99
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    pagamento unico
                  </span>
                </div>
                <SignInButton>
                  <Button
                    size="lg"
                    className="rounded-full bg-green-600 px-8 text-base font-bold hover:bg-green-700"
                  >
                    Garantir acesso vitalicio
                  </Button>
                </SignInButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Planos</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Comece grátis e evolua quando precisar.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-1 text-xl font-bold">Grátis</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Para começar a organizar suas finanças
              </p>
              <p className="mb-6 text-3xl font-extrabold">
                R$ 0
                <span className="text-base font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Até 15 transações/mês
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Dashboard completo
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Gestão de cartões
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Orçamentos por categoria
                </li>
              </ul>
              <SignInButton>
                <Button variant="outline" className="w-full">
                  Começar grátis
                </Button>
              </SignInButton>
            </div>
            {/* Premium */}
            <div className="flex flex-col rounded-xl border-2 border-primary/50 bg-primary/5 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold">Premium</h3>
                <span className="rounded-full bg-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
                  Popular
                </span>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                Para quem leva as finanças a sério
              </p>
              <p className="mb-6 text-3xl font-extrabold">
                R$ 14,99
                <span className="text-base font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Transações ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Relatórios com IA
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Conta compartilhada
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                  Tudo do plano grátis
                </li>
              </ul>
              <SignInButton>
                <Button className="w-full">Assinar Premium</Button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-8 sm:py-24">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Pronto para assumir o controle das suas finanças?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Junte-se a quem já organiza suas finanças de forma inteligente.
            Comece agora, é grátis.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <SignInButton>
              <Button size="lg" className="text-base font-semibold">
                Criar conta grátis
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </SignInButton>
            <a
              href="https://wa.me/5522988516223?text=Ol%C3%A1%2C%20vim%20pelo%20FinPlan.ai%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es!"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="text-base font-semibold"
              >
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/icon-finplanai-pwa.svg"
              width={24}
              height={24}
              alt="FinPlan AI"
            />
            <span className="text-sm font-semibold">FinPlan.ai</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FinPlan.ai. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>

      <WhatsAppFloatButton />
    </div>
  );
};

export default LandingPage;
