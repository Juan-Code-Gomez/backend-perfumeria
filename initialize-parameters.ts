// Script de inicialización para parámetros del sistema
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeSystemParameters() {
  console.log('🚀 Inicializando parámetros del sistema...');

  try {
    // Limpiar parámetros existentes (opcional)
    // await prisma.systemParameter.deleteMany({});
    
    // Parámetros del POS
    const posParameters = [
      {
        parameterKey: 'pos_edit_cost_enabled',
        parameterValue: false,
        description: 'Permite editar el costo del producto en el punto de venta',
        category: 'pos'
      },
      {
        parameterKey: 'pos_show_profit_margin',
        parameterValue: true,
        description: 'Mostrar margen de ganancia en tiempo real en POS',
        category: 'pos'
      },
      {
        parameterKey: 'pos_require_customer',
        parameterValue: false,
        description: 'Requerir cliente obligatorio en todas las ventas',
        category: 'pos'
      },
      {
        parameterKey: 'pos_allow_negative_stock',
        parameterValue: false,
        description: 'Permitir ventas con stock negativo',
        category: 'pos'
      }
    ];

    // Parámetros de inventario
    const inventoryParameters = [
      {
        parameterKey: 'inventory_auto_reorder',
        parameterValue: false,
        description: 'Generar órdenes automáticas cuando stock sea bajo',
        category: 'inventory'
      },
      {
        parameterKey: 'inventory_track_expiration',
        parameterValue: false,
        description: 'Rastrear fechas de vencimiento de productos',
        category: 'inventory'
      }
    ];

    // Parámetros de productos
    const productParameters = [
      {
        parameterKey: 'products_auto_barcode',
        parameterValue: true,
        description: 'Generar códigos de barras automáticamente',
        category: 'products'
      },
      {
        parameterKey: 'products_require_images',
        parameterValue: false,
        description: 'Requerir imágenes obligatorias para productos',
        category: 'products'
      }
    ];

    // Parámetros de precios
    const pricingParameters = [
      {
        parameterKey: 'pricing_auto_calculate',
        parameterValue: true,
        description: 'Calcular precios automáticamente basado en margen',
        category: 'pricing'
      },
      {
        parameterKey: 'pricing_allow_discount',
        parameterValue: true,
        description: 'Permitir descuentos en punto de venta',
        category: 'pricing'
      }
    ];

    // Parámetros de seguridad
    const securityParameters = [
      {
        parameterKey: 'audit_log_enabled',
        parameterValue: true,
        description: 'Registrar cambios importantes en log de auditoría',
        category: 'security'
      },
      {
        parameterKey: 'audit_track_cost_changes',
        parameterValue: true,
        description: 'Auditar cambios en costos de productos',
        category: 'security'
      }
    ];

    // Combinar todos los parámetros
    const allParameters = [
      ...posParameters,
      ...inventoryParameters,
      ...productParameters,
      ...pricingParameters,
      ...securityParameters
    ];

    // Insertar parámetros usando upsert para evitar duplicados
    for (const param of allParameters) {
      await prisma.systemParameter.upsert({
        where: { parameterKey: param.parameterKey },
        update: {
          description: param.description,
          category: param.category
        },
        create: param
      });
      console.log(`✅ Parámetro creado/actualizado: ${param.parameterKey}`);
    }

    console.log(`🎉 Inicialización completada. ${allParameters.length} parámetros procesados.`);
    
    // Mostrar parámetros por categoría
    const parameters = await prisma.systemParameter.findMany({
      orderBy: [{ category: 'asc' }, { parameterKey: 'asc' }]
    });

    console.log('\n📋 Parámetros del sistema por categoría:');
    let currentCategory = '';
    parameters.forEach(param => {
      if (param.category !== currentCategory) {
        currentCategory = param.category || 'general';
        console.log(`\n🏷️  ${currentCategory.toUpperCase()}:`);
      }
      console.log(`   ${param.parameterKey}: ${param.parameterValue} - ${param.description}`);
    });

  } catch (error) {
    console.error('❌ Error al inicializar parámetros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initializeSystemParameters();
}

export { initializeSystemParameters };