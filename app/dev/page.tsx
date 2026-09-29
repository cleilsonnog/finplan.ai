import Navbar from "@/app/_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/_lib/prisma";
import packageJson from "../../package.json";

const DEV_USER_ID = process.env.DEV_USER_ID;

export default async function DevPage() {
  const { userId } = await auth();
  if (!userId || (DEV_USER_ID && userId !== DEV_USER_ID)) {
    redirect("/");
  }

  const [
    transactionCount,
    userCount,
    creditCardCount,
    recurringExpenseCount,
    recurringIncomeCount,
    budgetCount,
    shoppingItemCount,
    pushSubCount,
    whatsappLinkCount,
    customCategoryCount,
  ] = await Promise.all([
    db.transaction.count(),
    db.whatsAppLink.count(),
    db.creditCard.count(),
    db.recurringExpense.count(),
    db.recurringIncome.count(),
    db.budget.count(),
    db.shoppingListItem.count(),
    db.pushSubscription.count(),
    db.whatsAppLink.count(),
    db.customCategory.count(),
  ]);

  const deps = Object.entries(packageJson.dependencies).map(([name, version]) => ({
    name,
    version: String(version).replace("^", ""),
  }));

  const devDeps = Object.entries(packageJson.devDependencies).map(([name, version]) => ({
    name,
    version: String(version).replace("^", ""),
  }));

  const dbStats = [
    { label: "Transações", count: transactionCount },
    { label: "Cartões de crédito", count: creditCardCount },
    { label: "Despesas recorrentes", count: recurringExpenseCount },
    { label: "Receitas recorrentes", count: recurringIncomeCount },
    { label: "Orçamentos", count: budgetCount },
    { label: "Itens lista de compras", count: shoppingItemCount },
    { label: "Links WhatsApp", count: whatsappLinkCount },
    { label: "Push subscriptions", count: pushSubCount },
    { label: "Categorias customizadas", count: customCategoryCount },
    { label: "Usuários (via WhatsApp)", count: userCount },
  ];

  const envStatus = [
    { key: "DATABASE_URL", set: !!process.env.DATABASE_URL },
    { key: "CLERK_SECRET_KEY", set: !!process.env.CLERK_SECRET_KEY },
    { key: "STRIPE_SECRET_KEY", set: !!process.env.STRIPE_SECRET_KEY },
    { key: "STRIPE_WEBHOOK_SECRET", set: !!process.env.STRIPE_WEBHOOK_SECRET },
    { key: "OPENAI_API_KEY", set: !!process.env.OPENAI_API_KEY },
    { key: "MERCADOPAGO_ACCESS_TOKEN", set: !!process.env.MERCADOPAGO_ACCESS_TOKEN },
    { key: "MERCADOPAGO_WEBHOOK_SECRET", set: !!process.env.MERCADOPAGO_WEBHOOK_SECRET },
    { key: "EVOLUTION_API_URL", set: !!process.env.EVOLUTION_API_URL },
    { key: "EVOLUTION_API_KEY", set: !!process.env.EVOLUTION_API_KEY },
    { key: "CRON_SECRET", set: !!process.env.CRON_SECRET },
    { key: "VAPID_PRIVATE_KEY", set: !!process.env.VAPID_PRIVATE_KEY },
    { key: "TELEGRAM_BOT_TOKEN", set: !!process.env.TELEGRAM_BOT_TOKEN },
    { key: "DEV_USER_ID", set: !!process.env.DEV_USER_ID },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 overflow-auto p-4 scrollbar-thin md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Dev Info</h1>
            <p className="text-sm text-muted-foreground">
              FinPlan.ai v{packageJson.version} — Informações técnicas do projeto
            </p>
          </div>

          {/* Stack */}
          <Section title="Stack">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Info label="Framework" value="Next.js 15 (App Router)" />
              <Info label="ORM" value="Prisma 5" />
              <Info label="Auth" value="Clerk" />
              <Info label="Database" value="PostgreSQL (Neon)" />
              <Info label="UI" value="shadcn/ui + Tailwind" />
              <Info label="AI" value="OpenAI (gpt-4o + Whisper)" />
              <Info label="Payments" value="Stripe + Mercado Pago" />
              <Info label="WhatsApp" value="Evolution API v1.8.6" />
              <Info label="Deploy" value="Vercel" />
              <Info label="VPS" value="212.56.33.113 (Cron + Evolution)" />
              <Info label="Node" value={process.version} />
              <Info label="Versão" value={`v${packageJson.version}`} />
            </div>
          </Section>

          {/* DB Stats */}
          <Section title="Banco de Dados">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {dbStats.map((s) => (
                <div key={s.label} className="rounded-md bg-muted p-2">
                  <p className="text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.count.toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Env Vars */}
          <Section title="Variáveis de Ambiente">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {envStatus.map((e) => (
                <div key={e.key} className="flex items-center gap-2 rounded-md bg-muted p-2">
                  <span className={e.set ? "text-green-500" : "text-red-500"}>
                    {e.set ? "●" : "○"}
                  </span>
                  <span className="font-mono text-xs">{e.key}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Dependencies */}
          <Section title={`Dependências (${deps.length})`}>
            <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
              {deps.map((d) => (
                <div key={d.name} className="flex justify-between rounded bg-muted px-2 py-1">
                  <span className="truncate font-mono">{d.name}</span>
                  <span className="ml-2 text-muted-foreground">{d.version}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Dev Dependencies */}
          <Section title={`Dev Dependencies (${devDeps.length})`}>
            <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
              {devDeps.map((d) => (
                <div key={d.name} className="flex justify-between rounded bg-muted px-2 py-1">
                  <span className="truncate font-mono">{d.name}</span>
                  <span className="ml-2 text-muted-foreground">{d.version}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
