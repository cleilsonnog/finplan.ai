-- CreateTable
CREATE TABLE "UserCategoryLabel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "UserCategoryLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCategoryLabel_userId_category_key" ON "UserCategoryLabel"("userId", "category");
