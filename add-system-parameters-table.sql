-- Migración para crear tabla de parámetros del sistema
-- Archivo: add-system-parameters-table.sql

-- Crear tabla de parámetros del sistema
CREATE TABLE system_parameters (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT NULL, -- Para multi-tenant en el futuro
    parameter_key VARCHAR(100) NOT NULL UNIQUE,
    parameter_value BOOLEAN DEFAULT FALSE,
    parameter_type VARCHAR(20) DEFAULT 'boolean' CHECK (parameter_type IN ('boolean', 'string', 'number', 'json')),
    string_value TEXT DEFAULT NULL,
    number_value DECIMAL(10,2) DEFAULT NULL,
    json_value JSONB DEFAULT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX idx_system_parameters_key ON system_parameters(parameter_key);
CREATE INDEX idx_system_parameters_category ON system_parameters(category);
CREATE INDEX idx_system_parameters_company ON system_parameters(company_id);

-- Insertar parámetros iniciales del sistema
INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category) VALUES
('pos_edit_cost_enabled', FALSE, 'boolean', 'Permite editar el costo del producto en el punto de venta', 'pos'),
('pos_show_profit_margin', TRUE, 'boolean', 'Mostrar margen de ganancia en tiempo real en POS', 'pos'),
('inventory_negative_stock', FALSE, 'boolean', 'Permitir stock negativo en inventario', 'inventory'),
('sales_require_customer', FALSE, 'boolean', 'Requerir cliente obligatorio en todas las ventas', 'sales'),
('pricing_auto_calculate', TRUE, 'boolean', 'Calcular precios automáticamente basado en margen', 'pricing'),
('audit_log_enabled', TRUE, 'boolean', 'Registrar cambios importantes en log de auditoría', 'security'),
('barcode_auto_generate', TRUE, 'boolean', 'Generar códigos de barras automáticamente para productos nuevos', 'products');

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_parameters_updated_at 
    BEFORE UPDATE ON system_parameters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE system_parameters IS 'Tabla para almacenar parámetros configurables del sistema';
COMMENT ON COLUMN system_parameters.parameter_key IS 'Clave única del parámetro';
COMMENT ON COLUMN system_parameters.parameter_value IS 'Valor booleano del parámetro';
COMMENT ON COLUMN system_parameters.parameter_type IS 'Tipo de dato del parámetro (boolean, string, number, json)';
COMMENT ON COLUMN system_parameters.category IS 'Categoría para agrupar parámetros relacionados';
COMMENT ON COLUMN system_parameters.company_id IS 'ID de empresa para configuraciones específicas (NULL = global)';