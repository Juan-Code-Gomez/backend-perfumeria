const { Client } = require('pg');

const databases = [
  {
    name: 'tramway (Cliente Principal)',
    connectionString: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  },
  {
    name: 'shinkansen (Cliente 2)',
    connectionString: 'postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway'
  },
  {
    name: 'turntable (Cliente 3)',
    connectionString: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  }
];

async function createCashSessionTable() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 CREACIÓN DE TABLA CashSession                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  let totalCreated = 0;

  for (const db of databases) {
    console.log('============================================================');
    console.log(`📊 ${db.name}`);
    console.log('============================================================\n');

    const client = new Client({ connectionString: db.connectionString });

    try {
      await client.connect();

      // Verificar si la tabla ya existe
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'CashSession'
        );
      `);

      if (tableExists.rows[0].exists) {
        console.log('   ℹ️  Tabla CashSession ya existe\n');
        continue;
      }

      // Crear la tabla CashSession
      await client.query(`
        CREATE TABLE "CashSession" (
          "id" SERIAL PRIMARY KEY,
          "sessionNumber" INTEGER NOT NULL,
          "date" TIMESTAMP(3) NOT NULL,
          "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "closedAt" TIMESTAMP(3),
          "openingCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "closingCash" DOUBLE PRECISION,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "openedById" INTEGER,
          "closedById" INTEGER,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CashSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "CashSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);

      // Crear índices
      await client.query(`
        CREATE INDEX "CashSession_date_sessionNumber_idx" ON "CashSession"("date", "sessionNumber");
      `);

      await client.query(`
        CREATE INDEX "CashSession_isActive_idx" ON "CashSession"("isActive");
      `);

      // Agregar foreign key a Sale si no existe
      const saleFKExists = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'Sale' 
        AND constraint_name = 'Sale_cashSessionId_fkey'
      `);

      if (saleFKExists.rows.length === 0) {
        await client.query(`
          ALTER TABLE "Sale" 
          ADD CONSTRAINT "Sale_cashSessionId_fkey" 
          FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
        `);
        console.log('   ✅ Foreign key Sale.cashSessionId agregada');
      }

      // Agregar foreign key a Expense si no existe
      const expenseFKExists = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'Expense' 
        AND constraint_name = 'Expense_cashSessionId_fkey'
      `);

      if (expenseFKExists.rows.length === 0) {
        await client.query(`
          ALTER TABLE "Expense" 
          ADD CONSTRAINT "Expense_cashSessionId_fkey" 
          FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
        `);
        console.log('   ✅ Foreign key Expense.cashSessionId agregada');
      }

      // Agregar foreign key a CashClosing si la tabla existe
      const cashClosingExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'CashClosing'
        );
      `);

      if (cashClosingExists.rows[0].exists) {
        const closingFKExists = await client.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'CashClosing' 
          AND constraint_name = 'CashClosing_cashSessionId_fkey'
        `);

        if (closingFKExists.rows.length === 0) {
          await client.query(`
            ALTER TABLE "CashClosing" 
            ADD CONSTRAINT "CashClosing_cashSessionId_fkey" 
            FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
          `);
          console.log('   ✅ Foreign key CashClosing.cashSessionId agregada');
        }
      }

      console.log('   ✅ Tabla CashSession creada exitosamente');
      console.log('   ✅ Índices creados\n');
      totalCreated++;

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } finally {
      await client.end();
    }
  }

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  📊 RESUMEN FINAL                                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Tablas CashSession creadas: ${totalCreated}`);
  console.log('\n🎉 ¡PROCESO COMPLETADO!\n');
}

createCashSessionTable().catch(console.error);
