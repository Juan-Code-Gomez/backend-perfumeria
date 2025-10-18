-- Script de inicialización temporal - ejecutar en la base de datos
-- hasta que resolvamos el problema del cliente Prisma

INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category, created_at, updated_at) 
VALUES 
    ('pos_edit_cost_enabled', FALSE, 'boolean', 'Permite editar el costo del producto en el punto de venta', 'pos', NOW(), NOW()),
    ('pos_show_profit_margin', TRUE, 'boolean', 'Mostrar margen de ganancia en tiempo real en POS', 'pos', NOW(), NOW()),
    ('audit_track_cost_changes', TRUE, 'boolean', 'Auditar cambios en costos de productos', 'security', NOW(), NOW())
ON CONFLICT (parameter_key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW();

-- Verificar que se insertaron correctamente
SELECT parameter_key, parameter_value, category, description FROM system_parameters ORDER BY category, parameter_key;