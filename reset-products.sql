-- Script para eliminar todos los productos y datos relacionados
-- CUIDADO: Este script eliminará TODOS los productos, movimientos y compras

-- Primero eliminar movimientos de productos (si existen)
DELETE FROM "ProductMovement";

-- Eliminar detalles de compras
DELETE FROM "PurchaseDetail";

-- Eliminar compras
DELETE FROM "Purchase";

-- Finalmente eliminar productos
DELETE FROM "Product";

-- Reiniciar los contadores de ID
ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ProductMovement_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Purchase_id_seq" RESTART WITH 1;
ALTER SEQUENCE "PurchaseDetail_id_seq" RESTART WITH 1;
