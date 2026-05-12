import { auth } from "@clerk/nextjs/server";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "../_components/ui/card";
import { CheckIcon, XIcon, ZapIcon, FlameIcon } from "lucide-react";
import AcquirePlanButton from "./_components/acquire-plan-button";
import AcquireLifetimeButton from "./_components/acquire-lifetime-button";
import PixPaymentModal from "./_components/pix-payment-modal";
import { Badge } from "../_components/ui/badge";
import { getCurrentMonthTransactions } from "@/app/_data/get-current-month-transactions";
import { hasPremiumAccess } from "@/app/_lib/has-premium-access";
import { hasLifetimeAccess } from "@/app/_lib/has-lifetime-access";
import WhatsAppFloatButton from "../_components/whatsapp-float-button";

const SubscriptionPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const currentMonthTransactions = await getCurrentMonthTransactions();
  const hasPremiumPlan = await hasPremiumAccess();
  const isLifetime = await hasLifetimeAccess();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold">Assinatura</h1>

        {/* Promo Vitalício — mostra oferta para não-premium OU confirmação para vitalícios */}
        {isLifetime ? (
          <Card className="relative overflow-hidden border-green-600/50 bg-gradient-to-br from-green-950/40 to-background lg:max-w-[930px]">
            <div className="absolute right-0 top-0 rounded-bl-lg bg-green-600 px-3 py-1 text-xs font-bold text-white">
              LAUNCH EDITION
            </div>
            <CardHeader className="pb-2 pt-8">
              <div className="flex items-center gap-2">
                <FlameIcon className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-bold text-green-500">
                  Acesso Vitalicio Ativo
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Voce faz parte dos primeiros usuarios do FinPlan.ai! Seu acesso
                Premium e vitalicio — sem mensalidade, sem renovacao. Aproveite
                todas as funcionalidades para sempre.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Transacoes ilimitadas</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Relatorios de IA</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Categorias personalizadas</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Compartilhar conta</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Acesso permanente — sem cobrancas futuras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !hasPremiumPlan ? (
          <Card className="relative overflow-hidden border-green-600/50 bg-gradient-to-br from-green-950/40 to-background lg:max-w-[930px]">
            <div className="absolute right-0 top-0 rounded-bl-lg bg-green-600 px-3 py-1 text-xs font-bold text-white">
              OFERTA DE LANCAMENTO
            </div>
            <CardHeader className="pb-2 pt-8">
              <div className="flex items-center gap-2">
                <FlameIcon className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-bold text-green-500">
                  Acesso Vitalicio Launch Edition
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Os 100 primeiros usuarios terao acesso vitalicio pagando apenas
                o valor de 1 mensalidade. Sem recorrencia, pague uma vez e use
                para sempre.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">
                    Tudo do plano Premium incluso
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Pagamento unico — sem mensalidade</p>
                </div>
                <div className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4 text-green-500" />
                  <p className="text-sm">Acesso permanente a todas as funcionalidades</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Apenas 100 vagas. Oferta valida apenas para os primeiros
                  usuarios.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold text-green-500">
                    14,99
                  </span>
                  <span className="text-sm text-muted-foreground">unico</span>
                </div>
                <AcquireLifetimeButton />
                <PixPaymentModal />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row">
          <Card className="w-full lg:w-[450px]">
            <CardHeader className="border-b border-solid py-8">
              <h2 className="text-center text-2xl font-semibold">
                Plano Básico
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">R$</span>
                <span className="text-6xl font-semibold">0</span>
                <div className="text-2xl text-muted-foreground">/mês</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>
                  Apenas 15 transações por mês
                  {!hasPremiumPlan && ` (${currentMonthTransactions}/15)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Controle de cartão de crédito</p>
              </div>
              <div className="flex items-center gap-2">
                <XIcon />
                <p>Relatórios de IA</p>
              </div>
              <div className="flex items-center gap-2">
                <XIcon />
                <p>Adicione categorias personalizadas</p>
              </div>
              <div className="flex items-center gap-2">
                <XIcon />
                <p>Compartilhar Conta</p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full lg:w-[450px]">
            <CardHeader className="relative border-b border-solid py-8">
              {hasPremiumPlan && (
                <Badge className="absolute left-4 top-12 bg-primary/10 text-primary">
                  {isLifetime ? "Vitalicio" : "Ativo"}
                </Badge>
              )}
              <h2 className="text-center text-2xl font-semibold">
                Plano Premium
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">R$</span>
                <span className="text-6xl font-semibold">14,99</span>
                <div className="text-2xl text-muted-foreground">
                  {isLifetime ? "unico" : "/mês"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Transações ilimitadas</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Controle de cartão de crédito</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Relatórios de IA</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Adicione categorias personalizadas</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Compartilhar Conta</p>
              </div>
              <AcquirePlanButton />
            </CardContent>
          </Card>
        </div>
      </div>
      <WhatsAppFloatButton />
    </div>
  );
};

export default SubscriptionPage;
