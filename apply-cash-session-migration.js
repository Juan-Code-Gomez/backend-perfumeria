const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyCashSessionMigration() {
  try {
    console.log('🔄 Applying cash session migration...');
    
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, 'add-cash-sessions-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir por declaraciones SQL individuales
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Ejecutar cada declaración
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}`);
      console.log(`   ${statement.substring(0, 50)}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`   ✅ Success`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        // Continúar con las siguientes declaraciones si es posible
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Table/column already exists, continuing...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 Cash session migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Restart your application');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyCashSessionMigration();