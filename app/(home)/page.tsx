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
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import { hasPremiumAccess } from "../_lib/has-premium-access";
import {
  getShareStatus,
  getPendingInvitesForUser,
} from "../_data/get-share-status";
import ShareAccountButton from "./_components/share-account-button";
import PendingInvitesBanner from "../_components/pending-invites-banner";
import SharedAccountBadge from "../_components/shared-account-badge";
import LandingPage from "./_components/landing-page";
import UpcomingRecurring from "./_components/upcoming-recurring";
import { getUpcomingRecurring } from "../_data/get-recurring-expenses";
import MonthlyBarChart from "./_components/monthly-bar-chart";
import { getMonthlyOverview } from "../_data/get-monthly-overview";
import DashboardCreditCards from "./_components/dashboard-credit-cards";

interface HomeProps {
  searchParams: Promise<{
    month: string;
  }>;
}

const Home = async ({ searchParams }: HomeProps) => {
  const result = await getEffectiveUserId();
  if (!result) {
    return <LandingPage />;
  }
  const { month } = await searchParams;
  const { effectiveUserId } = result;
  const monthIsInvalid = !month || !isMatch(month, "MM");
  if (monthIsInvalid) {
    redirect(`?month=${new Date().getMonth() + 1}`);
  }
  const hasPremiumPlan = await hasPremiumAccess();
  const [
    dashboard,
    creditCardsRaw,
    canAddTransaction,
    customCategories,
    shareStatus,
    pendingInvites,
    upcomingRecurring,
    monthlyOverview,
  ] = await Promise.all([
    getDashboard(month),
    db.creditCard.findMany({ where: { userId: effectiveUserId } }),
    canUserAddTransaction(),
    db.customCategory.findMany({
      where: { userId: effectiveUserId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getShareStatus(),
    getPendingInvitesForUser(),
    getUpcomingRecurring(),
    getMonthlyOverview(month),
  ]);
  const creditCards = creditCardsRaw.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col space-y-6 overflow-auto p-4 scrollbar-thin md:p-6">
        <PendingInvitesBanner invites={pendingInvites} />
        <UpcomingRecurring items={upcomingRecurring} />

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {shareStatus.role !== "none" && (
              <SharedAccountBadge
                role={shareStatus.role}
                partnerName={shareStatus.partnerName}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <ShareAccountButton
              hasPremiumPlan={hasPremiumPlan}
              shareStatus={shareStatus}
            />
            <AiReportButton month={month} hasPremiumPlan={hasPremiumPlan} />
            <TimeSelect />
          </div>
        </div>

        {/* KPIs */}
        <SummaryCards
          month={month}
          {...dashboard}
          creditCards={creditCards}
          canUserAddTransaction={canAddTransaction}
          customCategories={customCategories}
        />

        {/* Charts: Bar + Donut */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr,1fr]">
          <MonthlyBarChart data={monthlyOverview} />
          <TransactionsPieChart {...dashboard} />
        </div>

        {/* Credit Cards */}
        {dashboard.creditCardSummary.cards.length > 0 && (
          <DashboardCreditCards cards={dashboard.creditCardSummary.cards} />
        )}

        {/* Categories + Last Transactions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExpensesPerCategory
            expensesPerCategory={dashboard.totalExpensePerCategory}
          />
          <LastTransactions lastTransactions={dashboard.lastTransactions} />
        </div>
      </div>
    </div>
  );
};

export default Home;
