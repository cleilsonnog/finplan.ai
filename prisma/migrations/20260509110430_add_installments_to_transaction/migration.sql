-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "installmentNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1;
