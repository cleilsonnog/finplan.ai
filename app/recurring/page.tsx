import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { db } from "../_lib/prisma";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import { getRecurringExpenses } from "../_data/get-recurring-expenses";
import { getRecurringIncomes } from "../_data/get-recurring-incomes";
import RecurringList from "./_components/recurring-list";
import RecurringIncomeList from "./_components/recurring-income-list";

export const dynamic = "force-dynamic";

const RecurringPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/");
  }
  const userId = result.effectiveUserId;

  const [expenses, incomes, customCategories] = await Promise.all([
    getRecurringExpenses(),
    getRecurringIncomes(),
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
        <h1 className="text-2xl font-bold">Recorrentes</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecurringList
            expenses={expenses}
            customCategories={customCategories}
          />
          <RecurringIncomeList incomes={incomes} />
        </div>
      </div>
    </div>
  );
};

export default RecurringPage;
