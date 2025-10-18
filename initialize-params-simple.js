// initialize-params-simple.js
// Script simple para inicializar parámetros básicos usando consultas SQL directas

const { Client } = require('pg');
require('dotenv').config();

async function initializeParameters() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 Conectado a la base de datos');

    // Insertar parámetros básicos
    const parameters = [
      {
        key: 'pos_edit_cost_enabled',
        value: false,
        type: 'boolean',
        description: 'Permite editar el costo del producto en el punto de venta',
        category: 'pos'
      },
      {
        key: 'pos_show_profit_margin',
        value: true,
        type: 'boolean',
        description: 'Mostrar margen de ganancia en tiempo real en POS',
        category: 'pos'
      },
      {
        key: 'audit_track_cost_changes',
        value: true,
        type: 'boolean',
        description: 'Auditar cambios en costos de productos',
        category: 'security'
      }
    ];

    console.log('📝 Insertando parámetros...');

    for (const param of parameters) {
      const query = `
        INSERT INTO system_parameters (parameter_key, parameter_value, parameter_type, description, category, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (parameter_key) 
        DO UPDATE SET 
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          updated_at = NOW()
      `;

      await client.query(query, [
        param.key,
        param.value,
        param.type,
        param.description,
        param.category
      ]);

      console.log(`✅ ${param.key}: ${param.value}`);
    }

    // Verificar que se insertaron correctamente
    console.log('\n📋 Parámetros en la base de datos:');
    const result = await client.query(`
      SELECT parameter_key, parameter_value, category, description 
      FROM system_parameters 
      ORDER BY category, parameter_key
    `);

    result.rows.forEach(row => {
      console.log(`   ${row.parameter_key}: ${row.parameter_value} (${row.category}) - ${row.description}`);
    });

    console.log(`\n🎉 Inicialización completada. ${parameters.length} parámetros procesados.`);

  } catch (error) {
    console.error('❌ Error al inicializar parámetros:', error);
  } finally {
    await client.end();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar
initializeParameters();