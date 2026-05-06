"use client";

import { DataTable } from "@/app/_components/ui/data-table";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { createTransactionColumns, SerializedTransaction } from "../_columns";

interface TransactionsTableProps {
  transactions: SerializedTransaction[];
  creditCards: SerializedCreditCard[];
}

const TransactionsTable = ({
  transactions,
  creditCards,
}: TransactionsTableProps) => {
  const columns = createTransactionColumns(creditCards);
  return <DataTable columns={columns} data={transactions} />;
};

export default TransactionsTable;
