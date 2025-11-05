/**
 * Script para hacer backup de las bases de datos antes del deployment
 * Ejecutar con: node backup-production.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLIENTS = [
  {
    name: 'tramway',
    dbUrl: 'postgresql://postgres:huyVrrXIlyNOWCIXYnMuHNSACuYhDbog@tramway.proxy.rlwy.net:58936/railway'
  },
  {
    name: 'shinkansen',
    dbUrl: 'postgresql://postgres:SJBYEwPzlxYkrgMupzDOWYTAUXICMCHT@shinkansen.proxy.rlwy.net:21931/railway'
  },
  {
    name: 'turntable',
    dbUrl: 'postgresql://postgres:sramdnCvXZjwgHUZBUBvkvWGSvRuGgrZ@turntable.proxy.rlwy.net:38668/railway'
  }
];

async function backupClient(client) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(__dirname, 'backups');
  const backupFile = path.join(backupDir, `${client.name}_${timestamp}.sql`);

  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  console.log(`\n📦 Creando backup de ${client.name}...`);
  console.log(`   Archivo: ${backupFile}`);

  try {
    // Extraer componentes de la URL
    const url = new URL(client.dbUrl);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port;
    const database = url.pathname.slice(1);

    // Comando pg_dump
    const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p -f "${backupFile}"`;
    
    execSync(command, {
      env: { ...process.env, PGPASSWORD: password },
      stdio: 'inherit'
    });

    console.log(`✅ Backup completado: ${client.name}`);
    return true;

  } catch (error) {
    console.error(`❌ Error al crear backup de ${client.name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          BACKUP DE BASES DE DATOS DE PRODUCCIÓN                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  NOTA: Este script requiere tener PostgreSQL instalado localmente');
  console.log('   (específicamente el comando pg_dump)');
  console.log('');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('¿Deseas continuar? (s/n): ', async (answer) => {
    readline.close();

    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
      console.log('\n❌ Backup cancelado');
      process.exit(0);
    }

    console.log('\n🚀 Iniciando backups...\n');

    for (const client of CLIENTS) {
      await backupClient(client);
    }

    console.log('\n✅ Proceso de backup completado');
    console.log(`📁 Los backups están en: ${path.join(__dirname, 'backups')}\n`);
  });
}

main().catch(console.error);
