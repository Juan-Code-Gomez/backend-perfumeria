/*
  Warnings:

  - Added the required column `updatedAt` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDecimal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unitType" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
