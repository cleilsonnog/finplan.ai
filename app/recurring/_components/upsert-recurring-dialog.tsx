"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { MoneyInput } from "@/app/_components/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  buildCategoryOptions,
  CustomCategoryOption,
} from "@/app/_constants/transactions";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertRecurringExpense } from "@/app/_actions/recurring-expense";
import { Loader2Icon } from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  amount: z.number().positive("O valor deve ser positivo."),
  category: z.string().min(1, "A categoria é obrigatória."),
  dueDay: z.coerce
    .number()
    .int()
    .min(1, "Dia entre 1 e 31.")
    .max(31, "Dia entre 1 e 31."),
});

type FormData = z.infer<typeof formSchema>;

interface RecurringExpenseForEdit {
  id: string;
  name: string;
  amount: number;
  category: string;
  customCategoryId: string | null;
  dueDay: number;
}

interface UpsertRecurringDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  defaultValues?: RecurringExpenseForEdit;
  customCategories: CustomCategoryOption[];
}

const UpsertRecurringDialog = ({
  isOpen,
  setIsOpen,
  defaultValues,
  customCategories,
}: UpsertRecurringDialogProps) => {
  const categoryOptions = buildCategoryOptions(customCategories);

  const getCategoryValue = () => {
    if (!defaultValues) return "";
    if (defaultValues.customCategoryId) {
      return `custom:${defaultValues.customCategoryId}`;
    }
    return defaultValues.category;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          amount: defaultValues.amount,
          category: getCategoryValue(),
          dueDay: defaultValues.dueDay,
        }
      : {
          name: "",
          amount: 0,
          category: "",
          dueDay: 1,
        },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await upsertRecurringExpense(defaultValues?.id, data);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Editar" : "Adicionar"} Gasto Recorrente
          </DialogTitle>
          <DialogDescription>
            Cadastre contas fixas como aluguel, luz, internet, etc.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aluguel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue)
                      }
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia do vencimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ex: 10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {defaultValues ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertRecurringDialog;
