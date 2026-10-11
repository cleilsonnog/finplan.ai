import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { db } from "../_lib/prisma";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import { getRecurringExpenses } from "../_data/get-recurring-expenses";
import {
  getOtherIncomes,
  getRecurringIncomes,
} from "../_data/get-recurring-incomes";
import {
  currentPeriod,
  formatPeriod,
  isCanonicalPeriod,
  parsePeriod,
} from "../_utils/period";
import TimeSelect from "../(home)/_components/time-select";
import RecurringList from "./_components/recurring-list";
import RecurringIncomeList from "./_components/recurring-income-list";
import OtherIncomeList from "./_components/other-income-list";

export const revalidate = 60;

interface RecurringPageProps {
  searchParams: Promise<{ month: string }>;
}

const RecurringPage = async ({ searchParams }: RecurringPageProps) => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/");
  }
  const { month } = await searchParams;
  if (!isCanonicalPeriod(month)) {
    redirect(`/recurring?month=${formatPeriod(parsePeriod(month) ?? currentPeriod())}`);
  }
  const userId = result.effectiveUserId;

  const [expenses, incomes, otherIncomes, customCategories] = await Promise.all([
    getRecurringExpenses(month),
    getRecurringIncomes(month),
    getOtherIncomes(month),
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Recorrentes</h1>
          <TimeSelect />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecurringList
            expenses={expenses}
            customCategories={customCategories}
            month={month}
          />
          <div className="flex flex-col gap-6">
            <RecurringIncomeList incomes={incomes} month={month} />
            <OtherIncomeList
              incomes={otherIncomes}
              recurringIncomes={incomes}
              month={month}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringPage;
