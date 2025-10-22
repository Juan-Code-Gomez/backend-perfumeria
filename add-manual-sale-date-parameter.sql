-- Script para agregar el parámetro de fecha manual de ventas
-- Ejecutar solo en bases de datos que necesiten esta funcionalidad

-- Insertar el parámetro (si no existe)
INSERT INTO "system_parameters" (
  "parameter_key",
  "parameter_value",
  "parameter_type",
  "description",
  "category",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES (
  'allow_manual_sale_date',
  false,
  'boolean',
  'Permite seleccionar fecha manual al registrar ventas (para migración de datos históricos)',
  'sales',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("parameter_key") DO NOTHING;

-- Verificar que se insertó
SELECT * FROM "system_parameters" WHERE "parameter_key" = 'allow_manual_sale_date';
