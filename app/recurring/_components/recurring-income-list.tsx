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
  deleteRecurringIncome,
  toggleRecurringIncome,
  receiveRecurringIncome,
} from "@/app/_actions/recurring-income";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  PowerIcon,
  CheckCircleIcon,
} from "lucide-react";
import { useState } from "react";
import UpsertRecurringIncomeDialog from "./upsert-recurring-income-dialog";

interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  receiveDay: number;
  active: boolean;
  receivedThisMonth: boolean;
}

interface RecurringIncomeListProps {
  incomes: RecurringIncome[];
}

const RecurringIncomeList = ({ incomes }: RecurringIncomeListProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<
    RecurringIncome | undefined
  >();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingIncome(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (income: RecurringIncome) => {
    setEditingIncome(income);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setLoadingId(deleteId);
      await deleteRecurringIncome(deleteId);
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
      await toggleRecurringIncome(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      setLoadingId(id);
      await receiveRecurringIncome(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
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
          <CardTitle>Suas receitas recorrentes</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <PlusIcon className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {incomes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma receita recorrente cadastrada. Adicione seu salário,
              freelance, etc.
            </p>
          ) : (
            incomes.map((income) => (
              <div
                key={income.id}
                className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  !income.active ? "opacity-50" : ""
                } ${income.receivedThisMonth ? "border-green-500/30 bg-green-500/5" : ""}`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{income.name}</span>
                    {income.receivedThisMonth ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Recebido
                      </Badge>
                    ) : (
                      <Badge variant={income.active ? "default" : "secondary"}>
                        {income.active ? "Pendente" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {formatCurrency(income.amount)}
                    </span>
                    <span>Dia {income.receiveDay}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {income.active && !income.receivedThisMonth && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-green-500 hover:text-green-400"
                      onClick={() => handleReceive(income.id)}
                      disabled={loadingId === income.id}
                      title="Marcar como recebido"
                    >
                      {loadingId === income.id ? (
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
                    onClick={() => handleToggle(income.id)}
                    disabled={loadingId === income.id}
                    title={income.active ? "Desativar" : "Ativar"}
                  >
                    {loadingId === income.id ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <PowerIcon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleEdit(income)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setDeleteId(income.id)}
                    disabled={loadingId === income.id}
                  >
                    {loadingId === income.id ? (
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

      <UpsertRecurringIncomeDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        defaultValues={editingIncome}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja excluir esta receita recorrente?
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
    </>
  );
};

export default RecurringIncomeList;
