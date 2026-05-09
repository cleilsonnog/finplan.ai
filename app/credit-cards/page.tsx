import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { creditCardColumns } from "./_columns";
import AddCreditCardButton from "../_components/add-credit-card-button";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import CreditCardsSummary from "../(home)/_components/credit-cards-summary";
import DashboardCreditCards from "../(home)/_components/dashboard-credit-cards";
import { getCreditCardSummary } from "../_data/get-credit-card-summary";
import CreditCardTransactions from "./_components/credit-card-transactions";
import CreditCardInstallments from "./_components/credit-card-installments";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";

const CreditCardsPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/login");
  }
  const userId = result.effectiveUserId;
  const currentMonth = String(new Date().getMonth() + 1);
  const [creditCards, creditCardSummary, ccTransactions, installmentTransactions] =
    await Promise.all([
      db.creditCard.findMany({ where: { userId } }),
      getCreditCardSummary(currentMonth),
      db.transaction.findMany({
        where: {
          userId,
          paymentMethod: "CREDIT_CARD",
          creditCardId: { not: null },
        },
        include: {
          creditCard: { select: { name: true } },
          customCategory: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      }),
      db.transaction.findMany({
        where: {
          userId,
          paymentMethod: "CREDIT_CARD",
          installments: { gt: 1 },
          creditCardId: { not: null },
        },
        include: {
          creditCard: { select: { name: true } },
        },
        orderBy: [{ name: "asc" }, { installmentNumber: "asc" }],
      }),
    ]);
  const serializedCreditCards = creditCards.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  const serializedTransactions = ccTransactions.map((t) => ({
    id: t.id,
    name: t.name,
    amount: Number(t.amount),
    category: t.category,
    date: t.date.toISOString(),
    creditCardId: t.creditCardId,
    creditCardName: t.creditCard?.name ?? "",
    customCategory: t.customCategory,
  }));
  const creditCardOptions = creditCards.map((c) => ({
    id: c.id,
    name: c.name,
    lastFourDigits: c.lastFourDigits,
  }));

  // Group installment transactions by name + creditCardId
  const now = new Date();
  const installmentGroupsMap = new Map<
    string,
    {
      name: string;
      creditCardId: string;
      creditCardName: string;
      totalInstallments: number;
      installmentAmount: number;
      totalAmount: number;
      paidInstallments: number;
      startDate: string;
      nextDueDate: string | null;
    }
  >();

  for (const t of installmentTransactions) {
    const key = `${t.name}::${t.creditCardId}::${t.installments}`;
    const existing = installmentGroupsMap.get(key);
    const isPaid = new Date(t.date) <= now;

    if (!existing) {
      installmentGroupsMap.set(key, {
        name: t.name,
        creditCardId: t.creditCardId!,
        creditCardName: t.creditCard?.name ?? "",
        totalInstallments: t.installments,
        installmentAmount: Number(t.amount),
        totalAmount: Number(t.amount) * t.installments,
        paidInstallments: isPaid ? 1 : 0,
        startDate: t.date.toISOString(),
        nextDueDate: !isPaid ? t.date.toISOString() : null,
      });
    } else {
      if (isPaid) {
        existing.paidInstallments += 1;
      }
      if (!isPaid && !existing.nextDueDate) {
        existing.nextDueDate = t.date.toISOString();
      }
    }
  }

  const installmentGroups = Array.from(installmentGroupsMap.values()).map(
    (g) => ({
      ...g,
      remainingAmount:
        g.installmentAmount * (g.totalInstallments - g.paidInstallments),
    }),
  );
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col space-y-6 overflow-auto scroll-smooth scrollbar-thin p-4 md:p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Cartões de Crédito</h1>
          <AddCreditCardButton />
        </div>

        <CreditCardsSummary creditCardSummary={creditCardSummary} />

        <DashboardCreditCards cards={creditCardSummary.cards} />

        <div className="overflow-x-auto">
          <DataTable
            columns={creditCardColumns}
            data={serializedCreditCards}
          />
        </div>

        <CreditCardInstallments
          installmentGroups={installmentGroups}
          creditCards={creditCardOptions}
        />

        <CreditCardTransactions
          transactions={serializedTransactions}
          creditCards={creditCardOptions}
        />
      </div>
    </div>
  );
};

export default CreditCardsPage;
