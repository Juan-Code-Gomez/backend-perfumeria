-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" SERIAL NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "daysOfMonth" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);
