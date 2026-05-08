"use client";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { MoneyInput } from "./money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CARD_BRAND_OPTIONS } from "../_constants/credit-cards";
import { z } from "zod";
import { CardBrand } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertCreditCard } from "../_actions/upsert-credit-card";

interface UpsertCreditCardDialogProps {
  isOpen: boolean;
  defaultValues?: FormSchema;
  creditCardId?: string;
  setIsOpen: (isOpen: boolean) => void;
}

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório.",
  }),
  lastFourDigits: z.string().regex(/^\d{4}$/, {
    message: "Informe exatamente 4 dígitos.",
  }),
  brand: z.nativeEnum(CardBrand, {
    required_error: "A bandeira é obrigatória.",
  }),
  bank: z.string().trim().min(1, {
    message: "O banco é obrigatório.",
  }),
  limit: z
    .number({
      required_error: "O limite é obrigatório.",
    })
    .positive({
      message: "O limite deve ser positivo.",
    }),
  closingDay: z.coerce
    .number({
      required_error: "O dia de fechamento é obrigatório.",
    })
    .int()
    .min(1, { message: "Mínimo 1." })
    .max(31, { message: "Máximo 31." }),
  dueDay: z.coerce
    .number({
      required_error: "O dia de vencimento é obrigatório.",
    })
    .int()
    .min(1, { message: "Mínimo 1." })
    .max(31, { message: "Máximo 31." }),
});

type FormSchema = z.infer<typeof formSchema>;

const UpsertCreditCardDialog = ({
  isOpen,
  defaultValues,
  creditCardId,
  setIsOpen,
}: UpsertCreditCardDialogProps) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      name: "",
      lastFourDigits: "",
      brand: CardBrand.VISA,
      bank: "",
      limit: 1000,
      closingDay: 1,
      dueDay: 10,
    },
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      await upsertCreditCard({ ...data, id: creditCardId });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  const isUpdate = Boolean(creditCardId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Atualizar" : "Criar"} cartão de crédito
          </DialogTitle>
          <DialogDescription>Insira as informações abaixo</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastFourDigits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Últimos 4 dígitos</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0000"
                      maxLength={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bandeira</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a bandeira..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CARD_BRAND_OPTIONS.map((option) => (
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
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite</FormLabel>
                  <FormControl>
                    <MoneyInput
                      placeholder="Digite o limite..."
                      value={field.value}
                      onValueChange={({ floatValue }: { floatValue?: number }) =>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de fechamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de vencimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {isUpdate ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertCreditCardDialog;
