import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { transactionColumns } from "./_columns";
import AddTransactionButton from "../_components/upsert-transaction-dialog";

export const dynamic = "force-dynamic";

const TransactionsPage = async () => {
  const transactions = await db.transaction.findMany({});
  const serializedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));
  return (
    <div className="space-y-6 p-6">
      {/* TÍTULO E BOTÃO */}
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <AddTransactionButton />
      </div>
      <DataTable columns={transactionColumns} data={serializedTransactions} />
    </div>
  );
};

export default TransactionsPage;
