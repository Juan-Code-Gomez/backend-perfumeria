import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  // PERFUMES PRINCIPALES
  {
    name: 'Perfumes 1.1',
    description: 'Perfumes premium de primera calidad con concentración alta',
    color: '#8B5CF6', // Púrpura elegante
    icon: '💎',
    isActive: true,
  },
  {
    name: 'Perfumes Originales',
    description: 'Fragancias originales importadas de marcas reconocidas',
    color: '#F59E0B', // Dorado premium
    icon: '⭐',
    isActive: true,
  },

  // PERFUMES POR GÉNERO
  {
    name: 'Perfumes Masculinos',
    description: 'Fragancias diseñadas especialmente para hombres',
    color: '#3B82F6', // Azul masculino
    icon: '👨',
    isActive: true,
  },
  {
    name: 'Perfumes Femeninos',
    description: 'Fragancias delicadas y elegantes para mujeres',
    color: '#EC4899', // Rosa femenino
    icon: '👩',
    isActive: true,
  },
  {
    name: 'Perfumes Unisex',
    description: 'Fragancias versátiles para todos los géneros',
    color: '#10B981', // Verde neutral
    icon: '👫',
    isActive: true,
  },

  // COMPONENTES Y MATERIAS PRIMAS
  {
    name: 'Esencias',
    description: 'Esencias concentradas para la elaboración de perfumes',
    color: '#DC2626', // Rojo intenso
    icon: '🧪',
    isActive: true,
  },
  {
    name: 'Alcohol',
    description: 'Alcohol etílico para la dilución de fragancias',
    color: '#6B7280', // Gris neutral
    icon: '🍶',
    isActive: true,
  },
  {
    name: 'Fijador',
    description: 'Productos fijadores para prolongar la duración de las fragancias',
    color: '#7C3AED', // Púrpura oscuro
    icon: '🔒',
    isActive: true,
  },

  // ENVASES Y PACKAGING
  {
    name: 'Frascos',
    description: 'Envases y frascos para perfumes de diferentes tamaños',
    color: '#059669', // Verde botella
    icon: '🍾',
    isActive: true,
  },
  {
    name: 'Splahs',
    description: 'Atomizadores y sprays para fragancias ligeras',
    color: '#0EA5E9', // Azul splash
    icon: '💨',
    isActive: true,
  },

  // PRODUCTOS ESPECIALIZADOS
  {
    name: 'Cremas',
    description: 'Cremas corporales y lociones perfumadas',
    color: '#F97316', // Naranja cremoso
    icon: '🧴',
    isActive: true,
  },
  {
    name: 'Feromonas',
    description: 'Productos con feromonas para atracción',
    color: '#BE185D', // Rosa intenso
    icon: '💕',
    isActive: true,
  },
  {
    name: 'Aerosoles',
    description: 'Desodorantes y sprays corporales en aerosol',
    color: '#6366F1', // Índigo
    icon: '💨',
    isActive: true,
  },

  // SETS Y COMBOS
  {
    name: 'Combos',
    description: 'Combinaciones especiales de productos con descuentos',
    color: '#EF4444', // Rojo promocional
    icon: '🎁',
    isActive: true,
  },
  {
    name: 'Duos',
    description: 'Pares de productos complementarios',
    color: '#8B5CF6', // Púrpura
    icon: '👥',
    isActive: true,
  },
  {
    name: 'Estuches',
    description: 'Sets de regalo en estuches elegantes',
    color: '#D97706', // Ámbar
    icon: '🎀',
    isActive: true,
  },

  // SUBCATEGORÍAS ADICIONALES POR TIPO DE FRAGANCIA
  {
    name: 'Perfumes Florales',
    description: 'Fragancias con notas florales predominantes',
    color: '#F472B6', // Rosa floral
    icon: '🌸',
    isActive: true,
  },
  {
    name: 'Perfumes Cítricos',
    description: 'Fragancias frescas con notas cítricas',
    color: '#FDE047', // Amarillo cítrico
    icon: '🍋',
    isActive: true,
  },
  {
    name: 'Perfumes Amaderados',
    description: 'Fragancias con base amaderada y terrosa',
    color: '#92400E', // Marrón madera
    icon: '🌳',
    isActive: true,
  },
  {
    name: 'Perfumes Orientales',
    description: 'Fragancias exóticas con especias y ámbar',
    color: '#B45309', // Naranja especiado
    icon: '🌶️',
    isActive: true,
  },
  {
    name: 'Perfumes Frescos',
    description: 'Fragancias ligeras y refrescantes',
    color: '#06B6D4', // Cyan fresco
    icon: '❄️',
    isActive: true,
  },

  // CATEGORÍAS POR OCASIÓN
  {
    name: 'Perfumes de Día',
    description: 'Fragancias ligeras para uso diario',
    color: '#FBBF24', // Amarillo día
    icon: '☀️',
    isActive: true,
  },
  {
    name: 'Perfumes de Noche',
    description: 'Fragancias intensas para ocasiones especiales',
    color: '#1F2937', // Gris noche
    icon: '🌙',
    isActive: true,
  },
];

async function seedCategories() {
  console.log('🌱 Iniciando seed de categorías...');

  try {
    // Verificar categorías existentes
    console.log('📋 Verificando categorías existentes...');
    const existingCategories = await prisma.category.findMany({
      select: { name: true },
    });
    const existingNames = existingCategories.map(cat => cat.name);
    console.log(`   Encontradas ${existingNames.length} categorías existentes: ${existingNames.join(', ')}`);

    // Crear solo categorías nuevas
    console.log('📝 Creando nuevas categorías...');
    let createdCount = 0;
    for (const category of categories) {
      if (!existingNames.includes(category.name)) {
        const created = await prisma.category.create({
          data: category,
        });
        console.log(`✅ Categoría creada: ${created.name}`);
        createdCount++;
      } else {
        console.log(`⏭️  Categoría ya existe: ${category.name}`);
      }
    }

    console.log(`🎉 ¡Seed completado! Se crearon ${createdCount} categorías nuevas.`);

    // Mostrar estadísticas simples
    const totalCategories = await prisma.category.count();
    console.log('📊 Estadísticas:');
    console.log(`   ✅ Total de categorías en la base de datos: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed si es llamado directamente
if (require.main === module) {
  seedCategories()
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { seedCategories };
