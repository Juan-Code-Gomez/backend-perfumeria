-- Hacer que el campo 'nit' en la tabla Supplier sea nullable
-- Esto permite crear proveedores sin NIT

-- Modificar la columna para permitir NULL
ALTER TABLE "Supplier" 
ALTER COLUMN "nit" DROP NOT NULL;

-- Verificación: Mostrar la definición de la columna
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Supplier' 
AND column_name = 'nit';
