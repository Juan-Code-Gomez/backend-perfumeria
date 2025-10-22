-- Script para desactivar el parámetro de fecha manual de ventas
-- Ejecutar cuando se complete la migración de datos históricos

UPDATE "system_parameters"
SET 
  "parameter_value" = false,
  "updated_at" = NOW()
WHERE "parameter_key" = 'allow_manual_sale_date';

-- Verificar
SELECT 
  "parameter_key",
  "parameter_value" as "enabled",
  "description",
  "updated_at"
FROM "system_parameters"
WHERE "parameter_key" = 'allow_manual_sale_date';
