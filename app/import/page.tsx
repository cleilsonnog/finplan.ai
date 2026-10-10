import { redirect } from "next/navigation";
import Navbar from "../_components/navbar";
import { db } from "../_lib/prisma";
import { getEffectiveUserId } from "../_lib/get-effective-user-id";
import { getImportLimits } from "../_lib/import/limits";
import ImportFlow from "./_components/import-flow";
import RecentImports from "./_components/recent-imports";

const ImportPage = async () => {
  const result = await getEffectiveUserId();
  if (!result) redirect("/");
  const userId = result.effectiveUserId;

  const [creditCards, customCategories, userLabels, limits, batches] = await Promise.all([
    db.creditCard.findMany({
      where: { userId },
      select: { id: true, name: true, lastFourDigits: true },
      orderBy: { createdAt: "asc" },
    }),
    db.customCategory.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.userCategoryLabel.findMany({ where: { userId }, select: { category: true, label: true } }),
    getImportLimits(userId),
    db.importBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { creditCard: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 space-y-6 overflow-auto p-4 scrollbar-thin md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Importar extrato</h1>
          <p className="text-sm text-muted-foreground">
            Envie o extrato da conta (OFX) ou a fatura do cartão (PDF). Você revisa tudo antes de salvar.
          </p>
        </div>

        <ImportFlow
          creditCards={creditCards}
          customCategories={customCategories}
          categoryLabels={Object.fromEntries(userLabels.map((l) => [l.category, l.label]))}
          limits={limits}
        />

        <RecentImports
          batches={batches.map((b) => ({
            id: b.id,
            fileName: b.fileName,
            fileType: b.fileType,
            cardName: b.creditCard?.name ?? null,
            transactionCount: b.transactionCount,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
};

export default ImportPage;
