-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('OPEN', 'CLOSED', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "CreditCardBill" (
    "id" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'OPEN',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CreditCardBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardBill_creditCardId_month_year_key" ON "CreditCardBill"("creditCardId", "month", "year");

-- AddForeignKey
ALTER TABLE "CreditCardBill" ADD CONSTRAINT "CreditCardBill_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
