import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { db } from "../_lib/prisma";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import { getRecurringExpenses } from "../_data/get-recurring-expenses";
import RecurringList from "./_components/recurring-list";

export const dynamic = "force-dynamic";

const RecurringPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/login");
  }
  const userId = result.effectiveUserId;

  const [expenses, customCategories] = await Promise.all([
    getRecurringExpenses(),
    db.customCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 space-y-6 overflow-auto p-4 scrollbar-thin md:p-6">
        <h1 className="text-2xl font-bold">Gastos Recorrentes</h1>
        <div className="max-w-2xl">
          <RecurringList
            expenses={expenses}
            customCategories={customCategories}
          />
        </div>
      </div>
    </div>
  );
};

export default RecurringPage;
