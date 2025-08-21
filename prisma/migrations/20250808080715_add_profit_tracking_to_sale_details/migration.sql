/*
  Warnings:

  - Added the required column `profitAmount` to the `SaleDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profitMargin` to the `SaleDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchasePrice` to the `SaleDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SaleDetail" ADD COLUMN     "profitAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "profitMargin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "purchasePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "suggestedPrice" DOUBLE PRECISION;
