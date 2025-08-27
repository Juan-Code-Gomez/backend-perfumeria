-- CreateTable
CREATE TABLE "CapitalMovement" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "cashBefore" DOUBLE PRECISION,
    "bankBefore" DOUBLE PRECISION,
    "cashAfter" DOUBLE PRECISION,
    "bankAfter" DOUBLE PRECISION,
    "saleId" INTEGER,
    "invoiceId" INTEGER,
    "expenseId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapitalMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CapitalMovement_type_idx" ON "CapitalMovement"("type");

-- CreateIndex
CREATE INDEX "CapitalMovement_category_idx" ON "CapitalMovement"("category");

-- CreateIndex
CREATE INDEX "CapitalMovement_date_idx" ON "CapitalMovement"("date");
