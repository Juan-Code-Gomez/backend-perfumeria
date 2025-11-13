-- Remover constraint único de date en CashClosing
ALTER TABLE "CashClosing" DROP CONSTRAINT IF EXISTS "CashClosing_date_key";

-- Remover constraint único de (date, isActive) en CashSession
ALTER TABLE "CashSession" DROP CONSTRAINT IF EXISTS "unique_active_session_per_date";

-- Verificar que se eliminaron
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN ('CashClosing'::regclass, 'CashSession'::regclass)
AND contype = 'u';
