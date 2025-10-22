-- Script para crear la tabla system_parameters en Railway
-- Ejecutar en DBeaver o psql conectado a la base de datos de producción

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS system_parameters (
    id SERIAL PRIMARY KEY,
    parameter_key VARCHAR(255) NOT NULL UNIQUE,
    parameter_value BOOLEAN NOT NULL DEFAULT false,
    parameter_type VARCHAR(50) NOT NULL DEFAULT 'boolean',
    string_value TEXT,
    number_value DOUBLE PRECISION,
    json_value JSONB,
    description TEXT,
    category VARCHAR(100),
    company_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_system_parameters_key ON system_parameters(parameter_key);
CREATE INDEX IF NOT EXISTS idx_system_parameters_category ON system_parameters(category);
CREATE INDEX IF NOT EXISTS idx_system_parameters_company ON system_parameters(company_id);

-- Insertar parámetros básicos del sistema
INSERT INTO system_parameters (
    parameter_key,
    parameter_value,
    parameter_type,
    description,
    category,
    is_active
) VALUES
    ('pos_edit_cost_enabled', false, 'boolean', 'Permite editar el costo de productos en el POS', 'pos', true),
    ('pos_show_profit_margin', true, 'boolean', 'Muestra el margen de ganancia en el POS', 'pos', true),
    ('allow_manual_sale_date', false, 'boolean', 'Permite seleccionar fecha manual al registrar ventas (para migración de datos históricos)', 'sales', true),
    ('audit_track_cost_changes', true, 'boolean', 'Audita todos los cambios de costos de productos', 'security', true)
ON CONFLICT (parameter_key) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT 
    id,
    parameter_key,
    parameter_value,
    parameter_type,
    category,
    description,
    is_active
FROM system_parameters
ORDER BY category, parameter_key;

-- Mostrar el total de parámetros creados
SELECT 
    category,
    COUNT(*) as total_parametros
FROM system_parameters
GROUP BY category
ORDER BY category;
