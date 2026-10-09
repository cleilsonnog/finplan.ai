import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TotalExpensePerCategory } from "@/app/_data/get-dashboard/types";
import { getCategoryLabel } from "@/app/_utils/category";

interface ExpensesPerCategoryProps {
  expensesPerCategory: TotalExpensePerCategory[];
}

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ExpensesPerCategory = ({ expensesPerCategory }: ExpensesPerCategoryProps) => {
  const sorted = [...expensesPerCategory].sort((a, b) => b.totalAmount - a.totalAmount);
  // Bars scale to the largest category so differences stay readable
  const max = sorted[0]?.totalAmount ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Gastos por categoria</CardTitle>
        <p className="text-xs text-muted-foreground">Ordenado do maior para o menor</p>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[340px] px-6">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
          ) : (
            <div className="space-y-4 pb-6">
              {sorted.map((category) => (
                <div key={category.customCategoryId ?? category.category} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {getCategoryLabel(
                        category.category,
                        category.customCategoryId
                          ? { id: category.customCategoryId, name: category.customCategoryName ?? "" }
                          : null,
                      )}
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2">
                      <span className="tabular-nums">{fmt(category.totalAmount)}</span>
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                        {category.percentageOfTotal}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--viz-track)]">
                    <div
                      className="h-full rounded-full bg-[var(--viz-expense)]"
                      style={{ width: `${max > 0 ? (category.totalAmount / max) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExpensesPerCategory;
