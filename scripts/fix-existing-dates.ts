// Script para corregir fechas existentes en la base de datos (OPCIONAL)
// Solo ejecutar si hay datos con fechas incorrectas
// Ejecutar: npx ts-node scripts/fix-existing-dates.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingDates() {
  console.log('🔧 Iniciando corrección de fechas existentes...\n');

  try {
    // 1. Corregir gastos con fechas desfasadas
    console.log('1️⃣ Analizando gastos...');
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        date: true,
        description: true,
      },
    });

    console.log(`   Encontrados ${expenses.length} gastos`);
    
    let expensesFixed = 0;
    for (const expense of expenses) {
      const currentDate = new Date(expense.date);
      const expectedDate = new Date(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        12, 0, 0, 0
      );

      // Si hay diferencia, actualizar
      if (currentDate.getDate() !== expectedDate.getDate()) {
        await prisma.expense.update({
          where: { id: expense.id },
          data: { date: expectedDate },
        });
        console.log(`   ✅ Corregido: ${expense.description} (${currentDate.toLocaleDateString()} → ${expectedDate.toLocaleDateString()})`);
        expensesFixed++;
      }
    }
    console.log(`   ${expensesFixed > 0 ? `✅ ${expensesFixed} gastos corregidos` : '✅ No se encontraron gastos con fechas incorrectas'}\n`);

    // 2. Corregir ventas con fechas desfasadas
    console.log('2️⃣ Analizando ventas...');
    const sales = await prisma.sale.findMany({
      select: {
        id: true,
        date: true,
        customerName: true,
      },
    });

    console.log(`   Encontradas ${sales.length} ventas`);
    
    let salesFixed = 0;
    for (const sale of sales) {
      const currentDate = new Date(sale.date);
      const expectedDate = new Date(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        12, 0, 0, 0
      );

      if (currentDate.getDate() !== expectedDate.getDate()) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { date: expectedDate },
        });
        console.log(`   ✅ Corregida: Venta #${sale.id} (${currentDate.toLocaleDateString()} → ${expectedDate.toLocaleDateString()})`);
        salesFixed++;
      }
    }
    console.log(`   ${salesFixed > 0 ? `✅ ${salesFixed} ventas corregidas` : '✅ No se encontraron ventas con fechas incorrectas'}\n`);

    // 3. Corregir compras con fechas desfasadas
    console.log('3️⃣ Analizando compras...');
    const purchases = await prisma.purchase.findMany({
      select: {
        id: true,
        date: true,
      },
    });

    console.log(`   Encontradas ${purchases.length} compras`);
    
    let purchasesFixed = 0;
    for (const purchase of purchases) {
      const currentDate = new Date(purchase.date);
      const expectedDate = new Date(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        12, 0, 0, 0
      );

      if (currentDate.getDate() !== expectedDate.getDate()) {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { date: expectedDate },
        });
        console.log(`   ✅ Corregida: Compra #${purchase.id} (${currentDate.toLocaleDateString()} → ${expectedDate.toLocaleDateString()})`);
        purchasesFixed++;
      }
    }
    console.log(`   ${purchasesFixed > 0 ? `✅ ${purchasesFixed} compras corregidas` : '✅ No se encontraron compras con fechas incorrectas'}\n`);

    // 4. Corregir cierres de caja con fechas desfasadas
    console.log('4️⃣ Analizando cierres de caja...');
    const cashClosings = await prisma.cashClosing.findMany({
      select: {
        id: true,
        date: true,
      },
    });

    console.log(`   Encontrados ${cashClosings.length} cierres de caja`);
    
    let closingsFixed = 0;
    for (const closing of cashClosings) {
      const currentDate = new Date(closing.date);
      const expectedDate = new Date(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        12, 0, 0, 0
      );

      if (currentDate.getDate() !== expectedDate.getDate()) {
        await prisma.cashClosing.update({
          where: { id: closing.id },
          data: { date: expectedDate },
        });
        console.log(`   ✅ Corregido: Cierre #${closing.id} (${currentDate.toLocaleDateString()} → ${expectedDate.toLocaleDateString()})`);
        closingsFixed++;
      }
    }
    console.log(`   ${closingsFixed > 0 ? `✅ ${closingsFixed} cierres corregidos` : '✅ No se encontraron cierres con fechas incorrectas'}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Corrección completada exitosamente');
    console.log(`   Total corregido: ${expensesFixed + salesFixed + purchasesFixed + closingsFixed} registros`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  fixExistingDates()
    .then(() => {
      console.log('✅ Script finalizado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { fixExistingDates };
