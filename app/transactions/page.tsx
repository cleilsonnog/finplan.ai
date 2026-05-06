import { db } from "../_lib/prisma";
import AddTransactionButton from "../_components/upsert-transaction-dialog";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";
import TransactionsTable from "./_components/transactions-table";

const TransactionsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const [transactions, creditCards] = await Promise.all([
    db.transaction.findMany({
      where: { userId },
      include: { creditCard: { select: { name: true, lastFourDigits: true } } },
    }),
    db.creditCard.findMany({
      where: { userId },
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
    <>
      <Navbar />
      <div className="space-y-6 overflow-auto p-4 md:p-6">
        {/* TÍTULO E BOTÃO */}
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>
          <AddTransactionButton creditCards={serializedCreditCards} />
        </div>
        <ScrollArea>
          <TransactionsTable
            transactions={serializedTransactions}
            creditCards={serializedCreditCards}
          />
        </ScrollArea>
      </div>
    </>
  );
};

export default TransactionsPage;
