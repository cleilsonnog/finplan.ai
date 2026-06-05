import { db } from "../_lib/prisma";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { isMatch } from "date-fns";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import { ScrollArea } from "../_components/ui/scroll-area";
import TransactionsTable from "./_components/transactions-table";
import TimeSelect from "../(home)/_components/time-select";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";

interface TransactionsPageProps {
  searchParams: Promise<{ month: string }>;
}

const TransactionsPage = async ({ searchParams }: TransactionsPageProps) => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/");
  }
  const { month } = await searchParams;
  const monthIsInvalid = !month || !isMatch(month.padStart(2, "0"), "MM");
  if (monthIsInvalid) {
    redirect(`/transactions?month=${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  }
  const userId = result.effectiveUserId;
  const year = new Date().getFullYear();
  const monthNum = Number(month);
  const start = new Date(`${year}-${month.padStart(2, "0")}-01`);
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01`);

  const [transactions, creditCards, canAddTransaction, customCategories] =
    await Promise.all([
      db.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lt: end },
        },
        include: {
          creditCard: { select: { name: true, lastFourDigits: true } },
          customCategory: { select: { id: true, name: true } },
        },
      }),
      db.creditCard.findMany({
        where: { userId },
      }),
      canUserAddTransaction(),
      db.customCategory.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  const serializedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));
  const serializedCreditCards = creditCards.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col space-y-6 overflow-hidden p-4 md:p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>
          <div className="flex items-center gap-3">
            <TimeSelect />
            <AddTransactionButton
              canUserAddTransaction={canAddTransaction}
              creditCards={serializedCreditCards}
              customCategories={customCategories}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <TransactionsTable
            transactions={serializedTransactions}
            creditCards={serializedCreditCards}
            customCategories={customCategories}
          />
        </ScrollArea>
      </div>
    </div>
  );
};

export default TransactionsPage;
