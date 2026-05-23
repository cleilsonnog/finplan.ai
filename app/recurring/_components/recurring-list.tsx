"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Badge } from "@/app/_components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  deleteRecurringExpense,
  toggleRecurringExpense,
  payRecurringExpense,
} from "@/app/_actions/recurring-expense";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  PowerIcon,
  CheckCircleIcon,
} from "lucide-react";
import { useState } from "react";
import UpsertRecurringDialog from "./upsert-recurring-dialog";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
} from "@/app/_constants/transactions";
import { TransactionCategory, TransactionPaymentMethod } from "@prisma/client";
import { CustomCategoryOption } from "@/app/_constants/transactions";

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  customCategoryId: string | null;
  customCategory: { name: string } | null;
  dueDay: number;
  active: boolean;
  paidThisMonth: boolean;
}

interface RecurringListProps {
  expenses: RecurringExpense[];
  customCategories: CustomCategoryOption[];
}

const RecurringList = ({ expenses, customCategories }: RecurringListProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    RecurringExpense | undefined
  >();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<TransactionPaymentMethod>(
    TransactionPaymentMethod.PIX,
  );

  const handleAdd = () => {
    setEditingExpense(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setLoadingId(deleteId);
      await deleteRecurringExpense(deleteId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
      setDeleteId(null);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setLoadingId(id);
      await toggleRecurringExpense(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handlePay = async () => {
    if (!payId) return;
    try {
      setLoadingId(payId);
      await payRecurringExpense(payId, paymentMethod);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
      setPayId(null);
      setPaymentMethod(TransactionPaymentMethod.PIX);
    }
  };

  const getCategoryLabel = (expense: RecurringExpense) => {
    if (expense.customCategory) return expense.customCategory.name;
    return TRANSACTION_CATEGORY_LABELS[expense.category];
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Seus gastos recorrentes</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <PlusIcon className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum gasto recorrente cadastrado.
            </p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  !expense.active ? "opacity-50" : ""
                } ${expense.paidThisMonth ? "border-green-500/30 bg-green-500/5" : ""}`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{expense.name}</span>
                    {expense.paidThisMonth ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant={expense.active ? "default" : "secondary"}>
                        {expense.active ? "Pendente" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(expense.amount)}
                    </span>
                    <span>{getCategoryLabel(expense)}</span>
                    <span>Vence dia {expense.dueDay}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {expense.active && !expense.paidThisMonth && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-green-500 hover:text-green-400"
                      onClick={() => setPayId(expense.id)}
                      disabled={loadingId === expense.id}
                      title="Marcar como pago"
                    >
                      {loadingId === expense.id ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleToggle(expense.id)}
                    disabled={loadingId === expense.id}
                    title={expense.active ? "Desativar" : "Ativar"}
                  >
                    {loadingId === expense.id ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <PowerIcon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleEdit(expense)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setDeleteId(expense.id)}
                    disabled={loadingId === expense.id}
                  >
                    {loadingId === expense.id ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <UpsertRecurringDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        defaultValues={editingExpense}
        customCategories={customCategories}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja excluir este gasto recorrente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay confirmation */}
      <AlertDialog
        open={!!payId}
        onOpenChange={(open) => {
          if (!open) {
            setPayId(null);
            setPaymentMethod(TransactionPaymentMethod.PIX);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Uma transação de despesa será criada automaticamente com os dados
              deste gasto recorrente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="mb-2 block text-sm font-medium">
              Método de pagamento
            </label>
            <Select
              value={paymentMethod}
              onValueChange={(v) =>
                setPaymentMethod(v as TransactionPaymentMethod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_PAYMENT_METHOD_OPTIONS.filter(
                  (o) => o.value !== "CREDIT_CARD",
                ).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePay}>
              Confirmar pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecurringList;
