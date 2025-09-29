-- AddCompanyCodeToUser
-- This migration adds a companyCode field to the User table
-- Safe for production: only adds a new optional field

ALTER TABLE "User" ADD COLUMN "companyCode" TEXT;

-- Create index for better performance when filtering by company
CREATE INDEX "User_companyCode_idx" ON "User"("companyCode");