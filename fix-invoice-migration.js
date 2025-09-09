const { PrismaClient } = require('@prisma/client');

async function fixInvoiceSchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Iniciando reparación del esquema de Invoice...');
    
    // Verificar si las columnas existen
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Invoice' 
      AND column_name IN ('hasInventoryImpact', 'inventoryProcessed', 'isHistorical')
    `;
    
    console.log('📊 Columnas encontradas:', result);
    
    if (result.length === 0) {
      console.log('⚡ Aplicando migración...');
      
      // Agregar columnas faltantes
      await prisma.$executeRaw`
        ALTER TABLE "Invoice" 
        ADD COLUMN IF NOT EXISTS "hasInventoryImpact" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "inventoryProcessed" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "isHistorical" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "needsReconciliation" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "originalDocument" TEXT,
        ADD COLUMN IF NOT EXISTS "pricesAnalyzed" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "supplierId" INTEGER
      `;
      
      console.log('✅ Columnas agregadas exitosamente');
      
      // Crear índices
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Invoice_isHistorical_idx" ON "Invoice"("isHistorical")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Invoice_supplierId_idx" ON "Invoice"("supplierId")`;
      
      console.log('✅ Índices creados exitosamente');
      
    } else {
      console.log('✅ Las columnas ya existen, no se requiere migración');
    }
    
    // Verificar que las facturas se puedan consultar
    const invoiceCount = await prisma.invoice.count();
    console.log(`📈 Total de facturas: ${invoiceCount}`);
    
    const firstInvoice = await prisma.invoice.findFirst();
    console.log('🎯 Primera factura encontrada:', firstInvoice ? 'SÍ' : 'NO');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixInvoiceSchema()
    .then(() => {
      console.log('🎉 Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = { fixInvoiceSchema };
