import { db } from "../_lib/prisma";
import { DataTable } from "../_components/ui/data-table";
import { creditCardColumns } from "./_columns";
import AddCreditCardButton from "../_components/add-credit-card-button";
import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScrollArea } from "../_components/ui/scroll-area";

const CreditCardsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const creditCards = await db.creditCard.findMany({
    where: {
      userId,
    },
  });
  const serializedCreditCards = creditCards.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  return (
    <>
      <Navbar />
      <div className="space-y-6 overflow-auto p-4 md:p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Cartões de Crédito</h1>
          <AddCreditCardButton />
        </div>
        <ScrollArea>
          <DataTable
            columns={creditCardColumns}
            data={serializedCreditCards}
          />
        </ScrollArea>
      </div>
    </>
  );
};

export default CreditCardsPage;
