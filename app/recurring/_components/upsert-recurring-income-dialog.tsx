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
import { z } from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertRecurringIncome } from "@/app/_actions/recurring-income";
import { Loader2Icon } from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  amount: z.number().positive("O valor deve ser positivo."),
  receiveDay: z.coerce
    .number()
    .int()
    .min(1, "Dia entre 1 e 31.")
    .max(31, "Dia entre 1 e 31."),
});

type FormData = z.infer<typeof formSchema>;

interface RecurringIncomeForEdit {
  id: string;
  name: string;
  amount: number;
  receiveDay: number;
}

interface UpsertRecurringIncomeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  defaultValues?: RecurringIncomeForEdit;
}

const UpsertRecurringIncomeDialog = ({
  isOpen,
  setIsOpen,
  defaultValues,
}: UpsertRecurringIncomeDialogProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      receiveDay: 1,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (defaultValues) {
        form.reset({
          name: defaultValues.name,
          amount: defaultValues.amount,
          receiveDay: defaultValues.receiveDay,
        });
      } else {
        form.reset({ name: "", amount: 0, receiveDay: 1 });
      }
    }
  }, [isOpen, defaultValues]);

  const onSubmit = async (data: FormData) => {
    try {
      await upsertRecurringIncome(defaultValues?.id, data);
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
            {defaultValues ? "Editar" : "Adicionar"} Receita Recorrente
          </DialogTitle>
          <DialogDescription>
            Cadastre receitas fixas como salário, freelance, aluguel recebido,
            etc.
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
                    <Input placeholder="Ex: Salário" {...field} />
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
              name="receiveDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia do recebimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ex: 5"
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

export default UpsertRecurringIncomeDialog;
