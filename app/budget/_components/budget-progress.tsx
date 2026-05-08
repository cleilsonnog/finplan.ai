import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import {
  TRANSACTION_CATEGORY_LABELS,
} from "@/app/_constants/transactions";
import { TransactionCategory } from "@prisma/client";
import { AlertTriangleIcon } from "lucide-react";

interface CategoryBudget {
  category: TransactionCategory;
  budgeted: number;
  spent: number;
}

interface BudgetProgressProps {
  categories: CategoryBudget[];
  totalBudgeted: number;
  totalSpent: number;
}

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const BudgetProgress = ({
  categories,
  totalBudgeted,
  totalSpent,
}: BudgetProgressProps) => {
  const totalPercentage =
    totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
  const totalOver = totalSpent > totalBudgeted && totalBudgeted > 0;

  return (
    <div className="space-y-6">
      {/* Resumo geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Resumo do orçamento
            {totalOver && (
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Gasto: {formatCurrency(totalSpent)}
            </span>
            <span className="text-muted-foreground">
              Orçado: {formatCurrency(totalBudgeted)}
            </span>
          </div>
          <Progress
            value={totalPercentage}
            className={`h-3 ${totalOver ? "[&>div]:bg-red-500" : ""}`}
          />
          <p
            className={`text-sm font-medium ${totalOver ? "text-red-500" : "text-green-500"}`}
          >
            {totalOver
              ? `Acima do orçamento em ${formatCurrency(totalSpent - totalBudgeted)}`
              : `Restante: ${formatCurrency(totalBudgeted - totalSpent)}`}
          </p>
        </CardContent>
      </Card>

      {/* Por categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso por categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum orçamento definido. Defina limites acima para acompanhar
              seus gastos.
            </p>
          )}
          {categories.map(({ category, budgeted, spent }) => {
            const percentage =
              budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
            const isOver = spent > budgeted;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {TRANSACTION_CATEGORY_LABELS[category]}
                    {isOver && (
                      <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(spent)} / {formatCurrency(budgeted)}
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className={`h-2 ${isOver ? "[&>div]:bg-red-500" : ""}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetProgress;
