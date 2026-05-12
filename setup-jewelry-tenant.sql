-- ================================================
-- CONFIGURAR TENANT DE JOYERÍA - PRODUCCIÓN
-- ================================================
-- Este script configura un tenant existente como joyería
-- y asigna usuarios a ese tenant
-- ================================================

-- ========================================
-- PASO 1: Verificar tenants existentes
-- ========================================
SELECT 
    id,
    "companyName",
    industry,
    tenant_code,
    tenant_name,
    plan
FROM "CompanyConfig"
ORDER BY id;

-- ========================================
-- PASO 2: Configurar tenant como joyería
-- ========================================
-- IMPORTANTE: Cambiar el ID según el tenant que quieras configurar
-- Ejemplo: Si quieres que el tenant ID=2 sea la joyería, usa WHERE id = 2

UPDATE "CompanyConfig" 
SET 
    industry = 'JEWELRY',
    tenant_code = 'JEWELRY_001',
    tenant_name = 'Joyería Sisters',
    plan = 'PREMIUM'
WHERE id = 1; -- 👈 CAMBIAR ESTE ID SEGÚN TU TENANT

-- Verificar cambios
SELECT 
    id,
    "companyName",
    industry,
    tenant_code,
    tenant_name,
    plan
FROM "CompanyConfig"
WHERE id = 1; -- 👈 CAMBIAR ESTE ID

-- ========================================
-- PASO 3: Verificar usuarios existentes
-- ========================================
SELECT 
    u.id,
    u.name,
    u.user_login,
    u.tenant_id,
    u.company_id,
    c."companyName"
FROM "User" u
LEFT JOIN "CompanyConfig" c ON u.company_id = c.id
ORDER BY u.company_id, u.id;

-- ========================================
-- PASO 4: Asignar tenantId a usuarios
-- ========================================
-- Opción A: Asignar por company_id
UPDATE "User" 
SET tenant_id = 1  -- 👈 ID del tenant de joyería
WHERE company_id = 1; -- 👈 ID de la compañía

-- Opción B: Asignar a usuarios específicos por email
UPDATE "User" 
SET tenant_id = 1
WHERE user_login LIKE '%joyeria%' OR user_login LIKE '%jewelry%';

-- Opción C: Asignar a usuarios específicos por ID
UPDATE "User" 
SET tenant_id = 1
WHERE id IN (1, 2, 3); -- 👈 IDs de los usuarios

-- Verificar asignación
SELECT 
    u.id,
    u.name,
    u.user_login,
    u.tenant_id,
    c.tenant_name,
    c.industry
FROM "User" u
LEFT JOIN "CompanyConfig" c ON u.tenant_id = c.id
WHERE u.tenant_id IS NOT NULL
ORDER BY u.tenant_id, u.id;

-- ========================================
-- PASO 5: Verificar features disponibles
-- ========================================
SELECT 
    code,
    name,
    module,
    "featureType",
    "isActive"
FROM "Feature"
WHERE "isActive" = true
ORDER BY module, name;

-- ========================================
-- PASO 6: Verificar features del tenant
-- ========================================
SELECT 
    tf.tenant_id,
    c.tenant_name,
    tf.feature_code,
    f.name as feature_name,
    tf."isEnabled",
    tf.configuration
FROM "TenantFeature" tf
JOIN "Feature" f ON tf.feature_code = f.code
JOIN "CompanyConfig" c ON tf.tenant_id = c.id
WHERE tf.tenant_id = 1 -- 👈 CAMBIAR SEGÚN TU TENANT
ORDER BY f.module, f.name;

-- ========================================
-- PASO 7: Verificar campos personalizados
-- ========================================
SELECT 
    tcf.id,
    tcf.tenant_id,
    c.tenant_name,
    tcf.module,
    tcf."fieldName",
    tcf."fieldLabel",
    tcf."fieldType",
    tcf."isRequired",
    tcf."order"
FROM "TenantCustomField" tcf
JOIN "CompanyConfig" c ON tcf.tenant_id = c.id
WHERE tcf.tenant_id = 1 -- 👈 CAMBIAR SEGÚN TU TENANT
  AND tcf."isActive" = true
ORDER BY tcf.module, tcf."order";

-- ========================================
-- COMANDOS ÚTILES DE VERIFICACIÓN
-- ========================================

-- Ver cuántos usuarios hay por tenant
SELECT 
    c.id as tenant_id,
    c.tenant_name,
    c.industry,
    COUNT(u.id) as total_usuarios
FROM "CompanyConfig" c
LEFT JOIN "User" u ON u.tenant_id = c.id
GROUP BY c.id, c.tenant_name, c.industry
ORDER BY c.id;

-- Ver features más usados
SELECT 
    f.code,
    f.name,
    COUNT(tf.tenant_id) as tenants_activos
FROM "Feature" f
LEFT JOIN "TenantFeature" tf ON f.code = tf.feature_code AND tf."isEnabled" = true
GROUP BY f.code, f.name
ORDER BY tenants_activos DESC, f.name;

-- Ver campos personalizados por módulo
SELECT 
    module,
    COUNT(*) as total_campos,
    COUNT(DISTINCT tenant_id) as tenants_usando
FROM "TenantCustomField"
WHERE "isActive" = true
GROUP BY module
ORDER BY module;
