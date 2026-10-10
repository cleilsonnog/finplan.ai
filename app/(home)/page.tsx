import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import {
  currentPeriod,
  formatPeriod,
  isCanonicalPeriod,
  parsePeriod,
  periodLabel,
  toPeriod,
} from "../_utils/period";
import IncomeDistribution from "./_components/income-distribution";
import CreditCardOverview from "./_components/credit-card-overview";
import RecurringStatus from "./_components/recurring-status";
import ProjectionCard from "./_components/projection-card";
import { getProjection } from "../_data/get-projection";
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
import { getCreditCardOutlook } from "../_data/get-credit-card-outlook";
import { getPaymentStatus } from "../_data/get-payment-status";

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
  const { month: monthParam } = await searchParams;
  const { effectiveUserId } = result;
  // Canonical ?month=YYYY-MM; legacy ?month=MM links are upgraded to the current year
  if (!isCanonicalPeriod(monthParam)) {
    redirect(`?month=${formatPeriod(parsePeriod(monthParam) ?? currentPeriod())}`);
  }
  const month = monthParam;
  const period = toPeriod(month);
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
    creditCardOutlook,
    paymentStatus,
    projection,
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
    getCreditCardOutlook(month),
    getPaymentStatus(month),
    getProjection(month),
  ]);
  const creditCards = creditCardsRaw.map((c) => ({
    ...c,
    limit: Number(c.limit),
  }));
  const previousMonth = monthlyOverview[monthlyOverview.length - 2];
  const previous = previousMonth && {
    deposits: previousMonth.deposits,
    expenses: previousMonth.expenses + previousMonth.recurringPaid,
    investments: previousMonth.investments,
  };
  const monthLabel = periodLabel(period, false);
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col space-y-4 overflow-auto p-4 scrollbar-thin md:p-6">
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
          {...dashboard}
          previous={previous}
          creditCards={creditCards}
          canUserAddTransaction={canAddTransaction}
          customCategories={customCategories}
        />

        {/* Monthly trend + where the income went */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MonthlyBarChart data={monthlyOverview} />
          </div>
          <IncomeDistribution {...dashboard} />
        </div>

        {/* Credit cards: bills, limit and upcoming commitments */}
        <CreditCardOverview outlook={creditCardOutlook} monthLabel={monthLabel} />

        {/* Will the next months close in the red? */}
        <ProjectionCard projection={projection} />

        {/* Fixed bills + categories + last transactions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RecurringStatus
            totalPaid={paymentStatus.totalPaid}
            totalPending={paymentStatus.totalPending}
          />
          <ExpensesPerCategory
            expensesPerCategory={dashboard.totalExpensePerCategory}
          />
          <div className="md:col-span-2 xl:col-span-1">
            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
