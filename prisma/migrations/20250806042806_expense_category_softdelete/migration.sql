/*
  Warnings:

  - Added the required column `category` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SERVICIOS', 'SUMINISTROS', 'ALQUILER', 'OTRO');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL;
