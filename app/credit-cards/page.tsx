import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { creditCardColumns } from "./_columns";
import AddCreditCardButton from "../_components/add-credit-card-button";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreditCardsSummary from "../(home)/_components/credit-cards-summary";
import DashboardCreditCards from "../(home)/_components/dashboard-credit-cards";
import { getCreditCardSummary } from "../_data/get-credit-card-summary";
import CreditCardTransactions from "./_components/credit-card-transactions";

const CreditCardsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const currentMonth = String(new Date().getMonth() + 1);
  const [creditCards, creditCardSummary, ccTransactions] = await Promise.all([
    db.creditCard.findMany({ where: { userId } }),
    getCreditCardSummary(currentMonth),
    db.transaction.findMany({
      where: { userId, paymentMethod: "CREDIT_CARD", creditCardId: { not: null } },
      include: { creditCard: { select: { name: true } } },
      orderBy: { date: "desc" },
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
  }));
  const creditCardOptions = creditCards.map((c) => ({
    id: c.id,
    name: c.name,
    lastFourDigits: c.lastFourDigits,
  }));
  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-6 overflow-auto p-4 md:p-6">
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

        <CreditCardTransactions
          transactions={serializedTransactions}
          creditCards={creditCardOptions}
        />
      </div>
    </>
  );
};

export default CreditCardsPage;
