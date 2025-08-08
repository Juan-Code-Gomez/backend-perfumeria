/*
  Warnings:

  - You are about to drop the column `note` on the `ProductMovement` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `ProductMovement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductMovement" DROP COLUMN "note",
DROP COLUMN "price",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reason" TEXT;
