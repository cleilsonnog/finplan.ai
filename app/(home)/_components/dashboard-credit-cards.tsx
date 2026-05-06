"use client";

import { CreditCardSummaryItem } from "@/app/_data/get-credit-card-summary";
import CreditCardItem from "./credit-card-item";

interface DashboardCreditCardsProps {
  cards: CreditCardSummaryItem[];
}

const DashboardCreditCards = ({ cards }: DashboardCreditCardsProps) => {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {cards.map((item) => (
        <CreditCardItem key={item.card.id} data={item} />
      ))}
    </div>
  );
};

export default DashboardCreditCards;
