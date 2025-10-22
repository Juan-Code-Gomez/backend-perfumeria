-- Verificar el parámetro de fecha manual
-- Ejecutar en PostgreSQL (Railway)

SELECT 
  id,
  parameter_key,
  parameter_value,
  parameter_type,
  description,
  category,
  is_active,
  created_at,
  updated_at
FROM system_parameters
WHERE parameter_key = 'allow_manual_sale_date';

-- Si no existe, insertarlo con el script:
-- \i add-manual-sale-date-parameter.sql

-- Para activarlo manualmente:
-- \i enable-manual-sale-date.sql

-- Para verificar su estado:
SELECT 
  parameter_key,
  parameter_value::boolean as enabled,
  category
FROM system_parameters
WHERE category IN ('sales', 'pos')
ORDER BY parameter_key;
