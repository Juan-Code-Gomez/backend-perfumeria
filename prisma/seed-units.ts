import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUnits() {
  console.log('🏗️ Creando unidades...');

  const units = [
    // VOLUMEN - Para perfumes, esencias, líquidos
    {
      name: 'Mililitros',
      symbol: 'ml',
      description: 'Unidad de volumen para líquidos, ideal para perfumes y esencias',
      unitType: 'VOLUME',
      isActive: true,
      isDecimal: true,
    },
    {
      name: 'Litros',
      symbol: 'L',
      description: 'Unidad de volumen para cantidades grandes de líquidos',
      unitType: 'VOLUME',
      isActive: true,
      isDecimal: true,
    },
    {
      name: 'Onzas Fluidas',
      symbol: 'fl oz',
      description: 'Unidad de volumen en sistema imperial para perfumes',
      unitType: 'VOLUME',
      isActive: true,
      isDecimal: true,
    },

    // PESO - Para esencias sólidas, polvos, cremas
    {
      name: 'Gramos',
      symbol: 'g',
      description: 'Unidad de peso para esencias sólidas y cremas',
      unitType: 'WEIGHT',
      isActive: true,
      isDecimal: true,
    },
    {
      name: 'Kilogramos',
      symbol: 'kg',
      description: 'Unidad de peso para cantidades grandes',
      unitType: 'WEIGHT',
      isActive: true,
      isDecimal: true,
    },
    {
      name: 'Onzas',
      symbol: 'oz',
      description: 'Unidad de peso en sistema imperial',
      unitType: 'WEIGHT',
      isActive: true,
      isDecimal: true,
    },

    // CANTIDAD - Para frascos, combos, unidades discretas
    {
      name: 'Unidad',
      symbol: 'und',
      description: 'Unidad individual para frascos, combos y productos únicos',
      unitType: 'QUANTITY',
      isActive: true,
      isDecimal: false,
    },
    {
      name: 'Paquete',
      symbol: 'paq',
      description: 'Conjunto de unidades vendidas juntas',
      unitType: 'QUANTITY',
      isActive: true,
      isDecimal: false,
    },
    {
      name: 'Docena',
      symbol: 'doc',
      description: 'Conjunto de 12 unidades',
      unitType: 'QUANTITY',
      isActive: true,
      isDecimal: false,
    },
    {
      name: 'Par',
      symbol: 'par',
      description: 'Conjunto de 2 unidades',
      unitType: 'QUANTITY',
      isActive: true,
      isDecimal: false,
    },

    // LONGITUD - Para cintas, etiquetas
    {
      name: 'Centímetros',
      symbol: 'cm',
      description: 'Unidad de longitud para cintas y etiquetas',
      unitType: 'LENGTH',
      isActive: true,
      isDecimal: true,
    },
    {
      name: 'Metros',
      symbol: 'm',
      description: 'Unidad de longitud para materiales largos',
      unitType: 'LENGTH',
      isActive: true,
      isDecimal: true,
    },

    // ÁREA - Para etiquetas, packaging
    {
      name: 'Centímetros Cuadrados',
      symbol: 'cm²',
      description: 'Unidad de área para etiquetas y superficies',
      unitType: 'AREA',
      isActive: true,
      isDecimal: true,
    },

    // TIEMPO - Para servicios o procesos
    {
      name: 'Minutos',
      symbol: 'min',
      description: 'Unidad de tiempo para servicios',
      unitType: 'TIME',
      isActive: true,
      isDecimal: false,
    },
    {
      name: 'Horas',
      symbol: 'h',
      description: 'Unidad de tiempo para servicios largos',
      unitType: 'TIME',
      isActive: true,
      isDecimal: true,
    },
  ];

  let createdCount = 0;
  let existingCount = 0;

  for (const unitData of units) {
    try {
      const existingUnit = await prisma.unit.findUnique({
        where: { name: unitData.name },
      });

      if (existingUnit) {
        console.log(`⚠️ Unidad "${unitData.name}" ya existe, omitiendo...`);
        existingCount++;
        continue;
      }

      await prisma.unit.create({
        data: unitData,
      });

      console.log(`✅ Creada unidad: ${unitData.name} (${unitData.symbol}) - ${unitData.unitType}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creando unidad ${unitData.name}:`, error.message);
    }
  }

  console.log(`\n📊 Resumen de unidades:`);
  console.log(`✅ Creadas: ${createdCount}`);
  console.log(`⚠️ Ya existían: ${existingCount}`);
  console.log(`📦 Total procesadas: ${units.length}`);

  const totalUnits = await prisma.unit.count();
  console.log(`🎯 Total de unidades en base de datos: ${totalUnits}`);
}

export default seedUnits;

// Si el archivo se ejecuta directamente
if (require.main === module) {
  seedUnits()
    .catch((e) => {
      console.error('❌ Error en seed de unidades:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
