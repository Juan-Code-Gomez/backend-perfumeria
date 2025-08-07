/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "sortOrder",
DROP COLUMN "type",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "icon" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;
