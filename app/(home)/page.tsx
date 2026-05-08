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
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import AiReportButton from "./_components/ai-report-button";
import { clerkClient } from "@clerk/nextjs/server";

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
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const hasPremiumPlan =
    user.publicMetadata.subscriptionPlan === "premium";
  const [dashboard, creditCardsRaw, canAddTransaction] = await Promise.all([
    getDashboard(month),
    db.creditCard.findMany({ where: { userId } }),
    canUserAddTransaction(),
  ]);
  const creditCards = creditCardsRaw.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  return (
    <>
      <Navbar />
      <div className="flex h-full flex-col space-y-6 overflow-auto p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <AiReportButton month={month} hasPremiumPlan={hasPremiumPlan} />
            <TimeSelect />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-[2fr,1fr] lg:overflow-hidden">
          <div className="flex flex-col gap-6 lg:overflow-hidden">
            <SummaryCards
              month={month}
              {...dashboard}
              creditCards={creditCards}
              canUserAddTransaction={canAddTransaction}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-1 lg:h-full lg:overflow-hidden">
              <TransactionsPieChart {...dashboard} />
              <ExpensesPerCategory
                expensesPerCategory={dashboard.totalExpensePerCategory}
              />
            </div>
          </div>
          <LastTransactions lastTransactions={dashboard.lastTransactions} />
        </div>
      </div>
    </>
  );
};

export default Home;
