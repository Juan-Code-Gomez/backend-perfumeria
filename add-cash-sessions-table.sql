-- Migración para agregar sistema de turnos de caja
-- Fecha: 2025-11-07

-- 1. Agregar tabla para controlar turnos de caja
CREATE TABLE "CashSession" (
  "id" SERIAL PRIMARY KEY,
  "sessionNumber" INTEGER NOT NULL, -- Número de turno del día (1, 2, 3...)
  "date" DATE NOT NULL,
  "openedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "closedAt" TIMESTAMP NULL,
  "openingCash" FLOAT NOT NULL DEFAULT 0,
  "closingCash" FLOAT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "openedById" INTEGER REFERENCES "User"("id"),
  "closedById" INTEGER REFERENCES "User"("id"),
  "notes" TEXT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

-- 2. Agregar índices para mejor rendimiento
CREATE INDEX "CashSession_date_isActive_idx" ON "CashSession"("date", "isActive");
CREATE INDEX "CashSession_sessionNumber_date_idx" ON "CashSession"("sessionNumber", "date");

-- 3. Agregar campo a Sale para asociar con el turno de caja
ALTER TABLE "Sale" ADD COLUMN "cashSessionId" INTEGER REFERENCES "CashSession"("id");

-- 4. Agregar campo a Expense para asociar con el turno de caja
ALTER TABLE "Expense" ADD COLUMN "cashSessionId" INTEGER REFERENCES "CashSession"("id");

-- 5. Modificar CashClosing para asociar con el turno
ALTER TABLE "CashClosing" ADD COLUMN "cashSessionId" INTEGER REFERENCES "CashSession"("id");

-- 6. Agregar constraint para asegurar que solo haya una sesión activa por fecha
CREATE UNIQUE INDEX "CashSession_date_active_unique" 
ON "CashSession"("date") 
WHERE "isActive" = true;

-- 7. Comentarios para documentación
COMMENT ON TABLE "CashSession" IS 'Controla los turnos de caja - apertura y cierre por turno';
COMMENT ON COLUMN "CashSession"."sessionNumber" IS 'Número secuencial del turno en el día (1, 2, 3...)';
COMMENT ON COLUMN "CashSession"."isActive" IS 'Indica si el turno está actualmente activo (abierto)';