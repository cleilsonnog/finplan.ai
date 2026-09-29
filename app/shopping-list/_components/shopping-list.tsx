"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
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
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import {
  addShoppingItems,
  removeShoppingItem,
  clearShoppingList,
} from "@/app/_actions/shopping-list";
import {
  PlusIcon,
  Trash2Icon,
  ShoppingCartIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  name: string;
  createdAt: string;
}

interface ShoppingListProps {
  initialItems: ShoppingItem[];
}

const ShoppingList = ({ initialItems }: ShoppingListProps) => {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleAdd = () => {
    const names = newItem
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    startTransition(async () => {
      try {
        await addShoppingItems(names);
        setNewItem("");
        router.refresh();
        toast.success(
          names.length === 1
            ? `"${names[0]}" adicionado`
            : `${names.length} itens adicionados`,
        );
      } catch {
        toast.error("Erro ao adicionar item.");
      }
    });
  };

  const handleRemove = (item: ShoppingItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      try {
        await removeShoppingItem(item.id);
        toast.success(`"${item.name}" removido`);
      } catch {
        setItems((prev) => [...prev, item]);
        toast.error("Erro ao remover item.");
      }
    });
  };

  const handleClear = () => {
    const backup = items;
    setItems([]);
    startTransition(async () => {
      try {
        await clearShoppingList();
        toast.success("Lista limpa!");
      } catch {
        setItems(backup);
        toast.error("Erro ao limpar lista.");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCartIcon size={20} />
          Itens ({items.length})
        </CardTitle>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Limpar tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar lista?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os {items.length} itens serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ex: arroz, feijão, leite"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !newItem.trim()}>
            {isPending ? (
              <Loader2Icon size={16} className="animate-spin" />
            ) : (
              <PlusIcon size={16} />
            )}
          </Button>
        </form>

        {items.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Lista vazia. Adicione itens aqui ou pelo WhatsApp com{" "}
            <span className="font-medium">&quot;comprar arroz, feijão&quot;</span>
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span>{item.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(item)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ShoppingList;
