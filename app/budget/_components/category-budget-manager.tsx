"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { MoneyInput } from "@/app/_components/money-input";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import { TransactionCategory } from "@prisma/client";
import { useState } from "react";
import { upsertBudgets } from "../_actions/upsert-budgets";
import {
  createCustomCategory,
  deleteCustomCategory,
  updateCustomCategory,
  updateCategoryLabel,
  resetCategoryLabel,
} from "@/app/_actions/custom-categories";
import {
  CheckIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";

const EXPENSE_CATEGORIES = Object.values(TransactionCategory).filter(
  (c) => c !== TransactionCategory.SALARY,
);

interface CustomCategoryItem {
  id: string;
  name: string;
}

interface CategoryBudgetManagerProps {
  month: number;
  year: number;
  existingBudgets: Record<string, number>;
  initialEditing?: boolean;
  customCategories: CustomCategoryItem[];
  categoryLabels: Record<string, string>;
  hasPremium: boolean;
}

const CategoryBudgetManager = ({
  month,
  year,
  existingBudgets,
  initialEditing = false,
  customCategories,
  categoryLabels,
  hasPremium,
}: CategoryBudgetManagerProps) => {
  const [budgetValues, setBudgetValues] =
    useState<Record<string, number>>(existingBudgets);
  const [isEditingBudget, setIsEditingBudget] = useState(initialEditing);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Category rename state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Custom category create state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const getLabel = (category: TransactionCategory) =>
    categoryLabels[category] || TRANSACTION_CATEGORY_LABELS[category];

  const handleSaveBudgets = async () => {
    try {
      setIsSavingBudget(true);
      const budgetItems = [
        ...EXPENSE_CATEGORIES.map((category) => ({
          category,
          amount: budgetValues[category] ?? 0,
        })),
        ...customCategories.map((cc) => ({
          category: TransactionCategory.OTHER,
          customCategoryId: cc.id,
          amount: budgetValues[`custom:${cc.id}`] ?? 0,
        })),
      ];
      await upsertBudgets({ month, year, budgets: budgetItems });
      setIsEditingBudget(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleCancelBudgets = () => {
    setBudgetValues(existingBudgets);
    setIsEditingBudget(false);
  };

  const handleRenameCategory = async (category: string) => {
    if (!editLabel.trim()) return;
    try {
      setLoadingCategory(category);
      await updateCategoryLabel(category, editLabel.trim());
      setEditingCategory(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleResetLabel = async (category: string) => {
    try {
      setLoadingCategory(category);
      await resetCategoryLabel(category);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleCreateCustom = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsCreating(true);
      await createCustomCategory({ name: newCategoryName.trim() });
      setNewCategoryName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCustom = async (id: string) => {
    if (!editLabel.trim()) return;
    try {
      setLoadingCategory(id);
      await updateCustomCategory(id, { name: editLabel.trim() });
      setEditingCategory(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    try {
      setLoadingCategory(id);
      await deleteCustomCategory(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const formatCurrency = (value: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Categorias padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias padrão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {EXPENSE_CATEGORIES.map((category) => {
            const isEditing = editingCategory === category;
            const isLoading = loadingCategory === category;
            const hasCustomLabel = !!categoryLabels[category];
            const label = getLabel(category);
            const budgetValue = budgetValues[category] ?? 0;

            return (
              <div
                key={category}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameCategory(category);
                        if (e.key === "Escape") setEditingCategory(null);
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRenameCategory(category)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingCategory(null)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{label}</span>
                    {isEditingBudget && (
                      <div className="w-32">
                        <MoneyInput
                          placeholder="R$ 0,00"
                          value={budgetValue}
                          onValueChange={({
                            floatValue,
                          }: {
                            floatValue?: number;
                          }) =>
                            setBudgetValues((prev) => ({
                              ...prev,
                              [category]: floatValue ?? 0,
                            }))
                          }
                        />
                      </div>
                    )}
                    {!isEditingBudget && budgetValue > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(budgetValue)}
                      </span>
                    )}
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditLabel(label);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      {hasCustomLabel && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => handleResetLabel(category)}
                          disabled={isLoading}
                          title={`Restaurar: ${TRANSACTION_CATEGORY_LABELS[category]}`}
                        >
                          {isLoading ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcwIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Categorias customizadas */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias customizadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasPremium ? (
            <p className="text-sm text-muted-foreground">
              Categorias customizadas estão disponíveis no plano premium.
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCustom();
                  }}
                />
                <Button
                  onClick={handleCreateCustom}
                  disabled={isCreating || !newCategoryName.trim()}
                >
                  {isCreating ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <PlusIcon />
                  )}
                  Criar
                </Button>
              </div>

              {customCategories.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  Nenhuma categoria customizada criada.
                </p>
              ) : (
                <div className="space-y-2">
                  {customCategories.map((cc) => {
                    const isEditing = editingCategory === cc.id;
                    const isLoading = loadingCategory === cc.id;
                    const budgetKey = `custom:${cc.id}`;
                    const budgetValue = budgetValues[budgetKey] ?? 0;

                    return (
                      <div
                        key={cc.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {isEditing ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleUpdateCustom(cc.id);
                                if (e.key === "Escape")
                                  setEditingCategory(null);
                              }}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateCustom(cc.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckIcon className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingCategory(null)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium">
                              {cc.name}
                            </span>
                            {isEditingBudget && (
                              <div className="w-32">
                                <MoneyInput
                                  placeholder="R$ 0,00"
                                  value={budgetValue}
                                  onValueChange={({
                                    floatValue,
                                  }: {
                                    floatValue?: number;
                                  }) =>
                                    setBudgetValues((prev) => ({
                                      ...prev,
                                      [budgetKey]: floatValue ?? 0,
                                    }))
                                  }
                                />
                              </div>
                            )}
                            {!isEditingBudget && budgetValue > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(budgetValue)}
                              </span>
                            )}
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => {
                                  setEditingCategory(cc.id);
                                  setEditLabel(cc.name);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => handleDeleteCustom(cc.id)}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2Icon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Botões de orçamento */}
      <div className="flex justify-end gap-2">
        {isEditingBudget ? (
          <>
            <Button
              variant="outline"
              onClick={handleCancelBudgets}
              disabled={isSavingBudget}
            >
              <XIcon />
              Cancelar
            </Button>
            <Button onClick={handleSaveBudgets} disabled={isSavingBudget}>
              {isSavingBudget ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              Salvar orçamento
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditingBudget(true)}>
            <PencilIcon />
            Editar orçamento
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategoryBudgetManager;
