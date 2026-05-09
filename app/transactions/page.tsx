import { db } from "../_lib/prisma";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import { ScrollArea } from "../_components/ui/scroll-area";
import TransactionsTable from "./_components/transactions-table";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";

const TransactionsPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/login");
  }
  const userId = result.effectiveUserId;
  const [transactions, creditCards, canAddTransaction, customCategories] =
    await Promise.all([
      db.transaction.findMany({
        where: { userId },
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
          <AddTransactionButton
            canUserAddTransaction={canAddTransaction}
            creditCards={serializedCreditCards}
            customCategories={customCategories}
          />
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
