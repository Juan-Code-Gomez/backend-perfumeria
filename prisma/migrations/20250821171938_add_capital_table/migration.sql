-- CreateTable
CREATE TABLE "Capital" (
    "id" SERIAL NOT NULL,
    "cash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bank" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Capital_date_idx" ON "Capital"("date");
