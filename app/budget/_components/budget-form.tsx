"use client";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { MoneyInput } from "@/app/_components/money-input";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import { TransactionCategory } from "@prisma/client";
import { useState } from "react";
import { upsertBudgets } from "../_actions/upsert-budgets";
import { Loader2Icon, PencilIcon, SaveIcon, XIcon } from "lucide-react";

const EXPENSE_CATEGORIES = Object.values(TransactionCategory).filter(
  (c) => c !== TransactionCategory.SALARY,
);

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface BudgetFormProps {
  month: number;
  year: number;
  existingBudgets: Record<string, number>;
  initialEditing?: boolean;
}

const BudgetForm = ({
  month,
  year,
  existingBudgets,
  initialEditing = false,
}: BudgetFormProps) => {
  const [values, setValues] = useState<Record<string, number>>(existingBudgets);
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await upsertBudgets({
        month,
        year,
        budgets: EXPENSE_CATEGORIES.map((category) => ({
          category,
          amount: values[category] ?? 0,
        })),
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValues(existingBudgets);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Limites por categoria</CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              <XIcon />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              Salvar
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <PencilIcon />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPENSE_CATEGORIES.map((category) => (
              <div key={category} className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  {TRANSACTION_CATEGORY_LABELS[category]}
                </label>
                <MoneyInput
                  placeholder="R$ 0,00"
                  value={values[category] ?? 0}
                  onValueChange={({ floatValue }: { floatValue: number }) =>
                    setValues((prev) => ({
                      ...prev,
                      [category]: floatValue ?? 0,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPENSE_CATEGORIES.map((category) => {
              const value = values[category] ?? 0;
              return (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {TRANSACTION_CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-sm font-medium">
                    {value > 0 ? formatCurrency(value) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetForm;
