"use client";

import { CreditCardSummaryItem } from "@/app/_data/get-credit-card-summary";
import CreditCardItem from "./credit-card-item";
import AddCreditCardPlaceholder from "./add-credit-card-placeholder";

interface DashboardCreditCardsProps {
  cards: CreditCardSummaryItem[];
}

const DashboardCreditCards = ({ cards }: DashboardCreditCardsProps) => {
  // Fill remaining grid slots with placeholders so the grid never has empty space
  const cols = 3;
  const remainder = cards.length % cols;
  const placeholders = remainder === 0 ? 0 : cols - remainder;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((item) => (
        <CreditCardItem key={item.card.id} data={item} />
      ))}
      {Array.from({ length: placeholders }).map((_, i) => (
        <AddCreditCardPlaceholder key={`placeholder-${i}`} />
      ))}
    </div>
  );
};

export default DashboardCreditCards;
