-- Script para insertar parámetros iniciales del sistema
-- Ejecutar después de crear la tabla

-- Limpiar tabla si existe
DELETE FROM system_parameters;

-- Insertar parámetros del POS
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('pos_edit_cost_enabled', FALSE, 'boolean', 'Permite editar el costo del producto en el punto de venta', 'pos'),
('pos_show_profit_margin', TRUE, 'boolean', 'Mostrar margen de ganancia en tiempo real en POS', 'pos'),
('pos_require_customer', FALSE, 'boolean', 'Requerir cliente obligatorio en todas las ventas', 'pos'),
('pos_allow_negative_stock', FALSE, 'boolean', 'Permitir ventas con stock negativo', 'pos');

-- Insertar parámetros de inventario
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('inventory_auto_reorder', FALSE, 'boolean', 'Generar órdenes automáticas cuando stock sea bajo', 'inventory'),
('inventory_track_expiration', FALSE, 'boolean', 'Rastrear fechas de vencimiento de productos', 'inventory'),
('inventory_batch_tracking', FALSE, 'boolean', 'Rastrear lotes y números de serie', 'inventory');

-- Insertar parámetros de productos
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('products_auto_barcode', TRUE, 'boolean', 'Generar códigos de barras automáticamente', 'products'),
('products_require_images', FALSE, 'boolean', 'Requerir imágenes obligatorias para productos', 'products'),
('products_enable_variants', TRUE, 'boolean', 'Habilitar sistema de variantes de productos', 'products');

-- Insertar parámetros de precios
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('pricing_auto_calculate', TRUE, 'boolean', 'Calcular precios automáticamente basado en margen', 'pricing'),
('pricing_allow_discount', TRUE, 'boolean', 'Permitir descuentos en punto de venta', 'pricing'),
('pricing_max_discount', FALSE, 'boolean', 'Aplicar límite máximo de descuento', 'pricing');

-- Insertar parámetros de seguridad y auditoría
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('audit_log_enabled', TRUE, 'boolean', 'Registrar cambios importantes en log de auditoría', 'security'),
('audit_track_cost_changes', TRUE, 'boolean', 'Auditar cambios en costos de productos', 'security'),
('security_require_reason', FALSE, 'boolean', 'Requerir razón para cambios importantes', 'security');

-- Insertar parámetros de reportes
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('reports_auto_generate', FALSE, 'boolean', 'Generar reportes automáticamente', 'reports'),
('reports_send_email', FALSE, 'boolean', 'Enviar reportes por email automáticamente', 'reports');

-- Mostrar parámetros insertados
SELECT 
    category,
    parameter_key,
    parameter_value,
    description
FROM system_parameters 
ORDER BY category, parameter_key;