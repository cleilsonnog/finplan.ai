import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import { getShoppingList } from "../_data/get-shopping-list";
import ShoppingList from "./_components/shopping-list";

export const dynamic = "force-dynamic";

const ShoppingListPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/");
  }

  const items = await getShoppingList();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Lista de Compras</h1>
        <ShoppingList
          initialItems={items.map((i) => ({
            id: i.id,
            name: i.name,
            createdAt: i.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
};

export default ShoppingListPage;
