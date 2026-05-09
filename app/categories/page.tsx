import Navbar from "../_components/navbar";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../_lib/prisma";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import CategoryList from "./_components/category-list";
import { Button } from "../_components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CategoriesPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) {
    redirect("/login");
  }
  const userId = result.effectiveUserId;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const hasPremiumPlan = user.publicMetadata.subscriptionPlan === "premium";

  if (!hasPremiumPlan) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-2xl font-bold">Categorias Customizadas</h1>
          <p className="text-muted-foreground">
            Categorias customizadas estão disponíveis apenas no plano premium.
          </p>
          <Button asChild className="rounded-full font-bold">
            <Link href="/subscription">
              Assinar plano premium
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const categories = await db.customCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold">Categorias Customizadas</h1>
        <div className="max-w-xl">
          <CategoryList categories={categories} />
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
