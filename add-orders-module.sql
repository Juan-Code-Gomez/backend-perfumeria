-- Script para agregar el módulo de Pedidos al sistema
-- Este script debe ejecutarse en la base de datos de producción

-- 1. Insertar el módulo de Pedidos si no existe
INSERT INTO "Module" (name, "displayName", icon, route, description, "createdAt", "updatedAt")
SELECT 
  'pedidos',
  'Gestión de Pedidos',
  'FileTextOutlined',
  '/orders',
  'Módulo para gestionar pedidos de clientes con reserva de stock',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Module" WHERE name = 'pedidos'
);

-- 2. Obtener el ID del módulo recién insertado o existente
DO $$
DECLARE
  module_id INTEGER;
  admin_role_id INTEGER;
  cajero_role_id INTEGER;
  bodega_role_id INTEGER;
  vendedor_role_id INTEGER;
BEGIN
  -- Obtener el ID del módulo de pedidos
  SELECT id INTO module_id FROM "Module" WHERE name = 'pedidos';
  
  -- Obtener IDs de roles
  SELECT id INTO admin_role_id FROM "Role" WHERE name = 'ADMIN';
  SELECT id INTO cajero_role_id FROM "Role" WHERE name = 'CAJERO';
  SELECT id INTO bodega_role_id FROM "Role" WHERE name = 'BODEGA';
  SELECT id INTO vendedor_role_id FROM "Role" WHERE name = 'VENDEDOR';

  -- 3. Asignar permisos completos al rol ADMIN
  INSERT INTO "Permission" ("moduleId", "roleId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
  SELECT 
    module_id,
    admin_role_id,
    true,  -- view
    true,  -- create
    true,  -- edit
    true,  -- delete
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" WHERE "moduleId" = module_id AND "roleId" = admin_role_id
  );

  -- 4. Asignar permisos a CAJERO (crear, ver todos, editar, aprobar)
  INSERT INTO "Permission" ("moduleId", "roleId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
  SELECT 
    module_id,
    cajero_role_id,
    true,  -- view
    true,  -- create
    true,  -- edit
    false, -- delete (no puede cancelar)
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" WHERE "moduleId" = module_id AND "roleId" = cajero_role_id
  );

  -- 5. Asignar permisos a BODEGA (crear, ver todos, aprobar)
  INSERT INTO "Permission" ("moduleId", "roleId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
  SELECT 
    module_id,
    bodega_role_id,
    true,  -- view
    true,  -- create
    false, -- edit (no puede editar)
    false, -- delete (no puede cancelar)
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" WHERE "moduleId" = module_id AND "roleId" = bodega_role_id
  );

  -- 6. Asignar permisos a VENDEDOR (crear, ver propios)
  INSERT INTO "Permission" ("moduleId", "roleId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
  SELECT 
    module_id,
    vendedor_role_id,
    true,  -- view (solo ve sus propios pedidos)
    true,  -- create
    false, -- edit
    false, -- delete
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" WHERE "moduleId" = module_id AND "roleId" = vendedor_role_id
  );

  RAISE NOTICE 'Módulo de Pedidos configurado correctamente con ID: %', module_id;
END $$;

-- 7. Verificar la configuración
SELECT 
  m.id,
  m.name,
  m."displayName",
  m.route,
  r.name as role_name,
  p."canView",
  p."canCreate",
  p."canEdit",
  p."canDelete"
FROM "Module" m
LEFT JOIN "Permission" p ON m.id = p."moduleId"
LEFT JOIN "Role" r ON p."roleId" = r.id
WHERE m.name = 'pedidos'
ORDER BY r.name;
