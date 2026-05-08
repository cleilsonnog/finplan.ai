-- CreateTable
CREATE TABLE "CustomCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomCategory_userId_name_key" ON "CustomCategory"("userId", "name");

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN "customCategoryId" TEXT;

-- AddForeignKey Transaction -> CustomCategory
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customCategoryId_fkey" FOREIGN KEY ("customCategoryId") REFERENCES "CustomCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Budget
ALTER TABLE "Budget" ADD COLUMN "customCategoryId" TEXT;

-- DropIndex (old unique constraint)
DROP INDEX "Budget_userId_category_month_year_key";

-- CreateIndex (new unique constraint including customCategoryId)
CREATE UNIQUE INDEX "Budget_userId_category_customCategoryId_month_year_key" ON "Budget"("userId", "category", "customCategoryId", "month", "year");

-- AddForeignKey Budget -> CustomCategory
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_customCategoryId_fkey" FOREIGN KEY ("customCategoryId") REFERENCES "CustomCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
