-- CreateTable
CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL NOT NULL,
    "orderNumber" VARCHAR(50) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_details" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_history" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "previousStatus" VARCHAR(20),
    "newStatus" VARCHAR(20),
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_clientId_idx" ON "orders"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_orderDate_idx" ON "orders"("orderDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_details_orderId_idx" ON "order_details"("orderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_details_productId_idx" ON "order_details"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_history_orderId_idx" ON "order_history"("orderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_history_userId_idx" ON "order_history"("userId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_clientId_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_userId_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_details_orderId_fkey'
    ) THEN
        ALTER TABLE "order_details" ADD CONSTRAINT "order_details_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_details_productId_fkey'
    ) THEN
        ALTER TABLE "order_details" ADD CONSTRAINT "order_details_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_history_orderId_fkey'
    ) THEN
        ALTER TABLE "order_history" ADD CONSTRAINT "order_history_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_history_userId_fkey'
    ) THEN
        ALTER TABLE "order_history" ADD CONSTRAINT "order_history_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add reservedStock column to Product if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'reservedStock'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
END $$;
