import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import { isMatch } from "date-fns";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getDashboard } from "../_data/get-dashboard";
import ExpensesPerCategory from "./_components/expenses-per-category";
import LastTransactions from "./_components/last-transactions";
import { db } from "../_lib/prisma";
import DashboardCreditCards from "./_components/dashboard-credit-cards";

interface HomeProps {
  searchParams: Promise<{
    month: string;
  }>;
}

const Home = async ({ searchParams }: HomeProps) => {
  const { month } = await searchParams;
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const monthIsInvalid = !month || !isMatch(month, "MM");
  if (monthIsInvalid) {
    redirect(`?month=${new Date().getMonth() + 1}`);
  }
  const [dashboard, creditCardsRaw] = await Promise.all([
    getDashboard(month),
    db.creditCard.findMany({ where: { userId } }),
  ]);
  const creditCards = creditCardsRaw.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  return (
    <>
      <Navbar />
      <div className="flex min-h-full flex-col space-y-6 overflow-auto p-4 md:p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <TimeSelect />
        </div>
        <SummaryCards
          month={month}
          {...dashboard}
          creditCards={creditCards}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <TransactionsPieChart {...dashboard} />
            <ExpensesPerCategory
              expensesPerCategory={dashboard.totalExpensePerCategory}
            />
          </div>
          <LastTransactions lastTransactions={dashboard.lastTransactions} />
        </div>
        <DashboardCreditCards
          cards={dashboard.creditCardSummary.cards}
        />
      </div>
    </>
  );
};

export default Home;
