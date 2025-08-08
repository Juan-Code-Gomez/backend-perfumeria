// Script para probar carga masiva de inventario y cálculos financieros
// Este script simula llenar el Excel con datos reales de inventario

const XLSX = require('xlsx');

function createRealInventoryData() {
  console.log('📝 Creando datos de inventario realistas para prueba...');

  // Datos realistas basados en un inventario típico de perfumería
  const realInventoryData = [
    // ESENCIAS MÁS VENDIDAS
    {
      'Nombre': 'Esencia Chanel No 5',
      'Descripción': 'Esencia concentrada femenina clásica',
      'SKU': 'ESN-CH5-30',
      'Código de Barras': '',
      'Fragancia': 'Chanel No 5',
      'Categoría ID': 1,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': 'Chanel Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 12,        // 12 unidades en stock
      'Stock Mínimo': 5,
      'Precio Compra': 8500,     // $8,500 precio compra
      'Precio Venta': 18000,     // $18,000 precio venta
      'Precio Sugerido': 20000,
      'Proveedor ID': 1,
      'Notas': 'Muy vendida, siempre tener stock'
    },
    {
      'Nombre': 'Esencia Acqua di Gio',
      'Descripción': 'Esencia masculina fresca acuática',
      'SKU': 'ESN-ADG-30',
      'Código de Barras': '',
      'Fragancia': 'Acqua di Gio',
      'Categoría ID': 1,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': 'Giorgio Armani Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 8,
      'Stock Mínimo': 5,
      'Precio Compra': 9000,
      'Precio Venta': 19000,
      'Precio Sugerido': 22000,
      'Proveedor ID': 1,
      'Notas': 'Muy popular entre hombres'
    },
    {
      'Nombre': 'Esencia Black XS',
      'Descripción': 'Esencia masculina intensa y seductora',
      'SKU': 'ESN-BXS-30',
      'Código de Barras': '',
      'Fragancia': 'Black XS',
      'Categoría ID': 1,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': 'Paco Rabanne Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 15,
      'Stock Mínimo': 5,
      'Precio Compra': 7800,
      'Precio Venta': 17000,
      'Precio Sugerido': 19000,
      'Proveedor ID': 1,
      'Notas': 'Stock alto, venta rápida'
    },
    {
      'Nombre': 'Esencia Sauvage',
      'Descripción': 'Esencia masculina fresca y especiada',
      'SKU': 'ESN-SAU-30',
      'Código de Barras': '',
      'Fragancia': 'Sauvage',
      'Categoría ID': 1,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': 'Dior Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 6,
      'Stock Mínimo': 5,
      'Precio Compra': 9500,
      'Precio Venta': 20000,
      'Precio Sugerido': 23000,
      'Proveedor ID': 1,
      'Notas': 'Fragancia premium, stock justo'
    },
    {
      'Nombre': 'Esencia La Vie Est Belle',
      'Descripción': 'Esencia femenina dulce y floral',
      'SKU': 'ESN-LVEB-30',
      'Código de Barras': '',
      'Fragancia': 'La Vie Est Belle',
      'Categoría ID': 1,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': 'Lancôme Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 3,  // Stock bajo
      'Stock Mínimo': 5,
      'Precio Compra': 8800,
      'Precio Venta': 19500,
      'Precio Sugerido': 22000,
      'Proveedor ID': 1,
      'Notas': '¡STOCK BAJO! Reabastecer pronto'
    },

    // PERFUMES 1.1 - Los más armados
    {
      'Nombre': 'Perfume 1.1 Chanel No 5 100ml',
      'Descripción': 'Perfume armado similar al original',
      'SKU': 'PRF-CH5-100',
      'Código de Barras': '',
      'Fragancia': 'Chanel No 5',
      'Categoría ID': 2,
      'Unidad ID': 2,
      'Tipo Producto': 'VARIANT',
      'Tipo Variante': 'PERFUME_11',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': 'Chanel Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 4,
      'Stock Mínimo': 2,
      'Precio Compra': 15000,  // Costo de preparación
      'Precio Venta': 35000,   // Precio venta final
      'Precio Sugerido': 40000,
      'Proveedor ID': 1,
      'Notas': 'Perfume preparado con esencia + frasco + alcohol'
    },
    {
      'Nombre': 'Perfume 1.1 Acqua di Gio 100ml',
      'Descripción': 'Perfume armado masculino',
      'SKU': 'PRF-ADG-100',
      'Código de Barras': '',
      'Fragancia': 'Acqua di Gio',
      'Categoría ID': 2,
      'Unidad ID': 2,
      'Tipo Producto': 'VARIANT',
      'Tipo Variante': 'PERFUME_11',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': 'Giorgio Armani Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 2,
      'Stock Mínimo': 2,
      'Precio Compra': 16000,
      'Precio Venta': 38000,
      'Precio Sugerido': 42000,
      'Proveedor ID': 1,
      'Notas': 'Muy solicitado, preparar más'
    },

    // FRASCOS - Inventario de envases
    {
      'Nombre': 'Frasco Atomizador 30ml Dorado',
      'Descripción': 'Frasco con atomizador premium',
      'SKU': 'FRS-30-DOR',
      'Código de Barras': '',
      'Fragancia': '',
      'Categoría ID': 3,
      'Unidad ID': 2,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'FRASCO',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': '',
      'Género': 'UNISEX',
      'Stock Actual': 25,  // Buen stock de frascos
      'Stock Mínimo': 10,
      'Precio Compra': 2500,
      'Precio Venta': 6000,
      'Precio Sugerido': 7000,
      'Proveedor ID': 2,
      'Notas': 'Frascos elegantes para esencias'
    },
    {
      'Nombre': 'Frasco Atomizador 100ml Plateado',
      'Descripción': 'Frasco elegante para perfumes',
      'SKU': 'FRS-100-PLA',
      'Código de Barras': '',
      'Fragancia': '',
      'Categoría ID': 3,
      'Unidad ID': 2,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'FRASCO',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': '',
      'Género': 'UNISEX',
      'Stock Actual': 18,
      'Stock Mínimo': 10,
      'Precio Compra': 3500,
      'Precio Venta': 8000,
      'Precio Sugerido': 9000,
      'Proveedor ID': 2,
      'Notas': 'Para perfumes 1.1 de 100ml'
    },

    // SPLASHS - Productos terminados
    {
      'Nombre': 'Splash Good Girl 250ml',
      'Descripción': 'Splash corporal femenino',
      'SKU': 'SPL-GG-250',
      'Código de Barras': '',
      'Fragancia': 'Good Girl',
      'Categoría ID': 4,
      'Unidad ID': 2,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'SPLASH',
      'Tamaño': '250ml',
      'Valor Tamaño': 250,
      'Marca': 'Carolina Herrera Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 7,
      'Stock Mínimo': 3,
      'Precio Compra': 12000,
      'Precio Venta': 25000,
      'Precio Sugerido': 28000,
      'Proveedor ID': 3,
      'Notas': 'Splash popular entre mujeres jóvenes'
    },
    {
      'Nombre': 'Splash Escarchado Polo Blue 250ml',
      'Descripción': 'Splash con partículas escarchadas',
      'SKU': 'SPL-PB-ESC-250',
      'Código de Barras': '',
      'Fragancia': 'Polo Blue',
      'Categoría ID': 4,
      'Unidad ID': 2,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'SPLASH_ESCARCHADO',
      'Tamaño': '250ml',
      'Valor Tamaño': 250,
      'Marca': 'Ralph Lauren Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 5,
      'Stock Mínimo': 3,
      'Precio Compra': 13500,
      'Precio Venta': 27000,
      'Precio Sugerido': 30000,
      'Proveedor ID': 3,
      'Notas': 'Efecto escarchado muy atractivo'
    },

    // CREMAS
    {
      'Nombre': 'Crema Hidratante Coco Chanel 200g',
      'Descripción': 'Crema corporal hidratante',
      'SKU': 'CRM-CCH-200',
      'Código de Barras': '',
      'Fragancia': 'Coco Chanel',
      'Categoría ID': 5,
      'Unidad ID': 3,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'CREMA',
      'Tamaño': '200g',
      'Valor Tamaño': 200,
      'Marca': 'Chanel Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 6,
      'Stock Mínimo': 2,
      'Precio Compra': 8000,
      'Precio Venta': 18000,
      'Precio Sugerido': 20000,
      'Proveedor ID': 4,
      'Notas': 'Crema de alta calidad, hidratación duradera'
    },

    // INSUMOS PARA PREPARACIÓN
    {
      'Nombre': 'Alcohol Etílico 70% - 1L',
      'Descripción': 'Alcohol para diluir esencias',
      'SKU': 'ALC-70-1000',
      'Código de Barras': '',
      'Fragancia': '',
      'Categoría ID': 7,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '1000ml',
      'Valor Tamaño': 1000,
      'Marca': '',
      'Género': 'UNISEX',
      'Stock Actual': 3,  // Pocos litros
      'Stock Mínimo': 2,
      'Precio Compra': 5000,
      'Precio Venta': 12000,
      'Precio Sugerido': 0,  // No se vende directamente
      'Proveedor ID': 1,
      'Notas': 'Insumo esencial para preparación'
    },
    {
      'Nombre': 'Fijador Concentrado 100ml',
      'Descripción': 'Fijador para perfumes',
      'SKU': 'FIJ-CONC-100',
      'Código de Barras': '',
      'Fragancia': '',
      'Categoría ID': 7,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': '',
      'Género': 'UNISEX',
      'Stock Actual': 2,
      'Stock Mínimo': 1,
      'Precio Compra': 8000,
      'Precio Venta': 18000,
      'Precio Sugerido': 0,  // No se vende directamente
      'Proveedor ID': 1,
      'Notas': 'Hace que el perfume dure más'
    }
  ];

  // Calcular totales para mostrar estadísticas
  let totalInvertido = 0;
  let valorTotalVenta = 0;
  let totalUnidades = 0;

  realInventoryData.forEach(producto => {
    const inversion = producto['Stock Actual'] * producto['Precio Compra'];
    const valorVenta = producto['Stock Actual'] * producto['Precio Venta'];
    
    totalInvertido += inversion;
    valorTotalVenta += valorVenta;
    totalUnidades += producto['Stock Actual'];
  });

  const gananciaEstimada = valorTotalVenta - totalInvertido;
  const margenGanancia = totalInvertido > 0 ? ((gananciaEstimada / totalInvertido) * 100) : 0;

  console.log('');
  console.log('📊 ESTADÍSTICAS DEL INVENTARIO SIMULADO:');
  console.log('');
  console.log(`💰 INVERSIÓN TOTAL: $${totalInvertido.toLocaleString()}`);
  console.log(`💵 VALOR DE VENTA: $${valorTotalVenta.toLocaleString()}`);
  console.log(`📈 GANANCIA ESTIMADA: $${gananciaEstimada.toLocaleString()}`);
  console.log(`📊 MARGEN DE GANANCIA: ${margenGanancia.toFixed(1)}%`);
  console.log(`📦 TOTAL UNIDADES: ${totalUnidades}`);
  console.log(`🏷️ PRODUCTOS DIFERENTES: ${realInventoryData.length}`);
  console.log('');

  // Productos con stock bajo
  const stockBajo = realInventoryData.filter(p => p['Stock Actual'] <= p['Stock Mínimo']);
  if (stockBajo.length > 0) {
    console.log('🚨 PRODUCTOS CON STOCK BAJO:');
    stockBajo.forEach(p => {
      console.log(`   ⚠️ ${p.Nombre}: ${p['Stock Actual']} unidades (mín: ${p['Stock Mínimo']})`);
    });
    console.log('');
  }

  // Top 5 productos más valiosos por inversión
  const topInversiones = [...realInventoryData]
    .map(p => ({
      nombre: p.Nombre,
      inversion: p['Stock Actual'] * p['Precio Compra'],
      stock: p['Stock Actual']
    }))
    .sort((a, b) => b.inversion - a.inversion)
    .slice(0, 5);

  console.log('💎 TOP 5 PRODUCTOS CON MAYOR INVERSIÓN:');
  topInversiones.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.nombre}: $${p.inversion.toLocaleString()} (${p.stock} unidades)`);
  });

  return {
    data: realInventoryData,
    statistics: {
      totalInvertido,
      valorTotalVenta,
      gananciaEstimada,
      margenGanancia,
      totalUnidades,
      totalProductos: realInventoryData.length,
      stockBajo: stockBajo.length,
      topInversiones
    }
  };
}

function createFilledExcel() {
  const inventoryResult = createRealInventoryData();
  
  // Crear workbook con los datos
  const wb = XLSX.utils.book_new();
  
  // Hoja principal con datos reales
  const wsInventory = XLSX.utils.json_to_sheet(inventoryResult.data);
  
  // Hacer columnas más anchas
  wsInventory['!cols'] = [
    { wch: 30 }, // Nombre
    { wch: 40 }, // Descripción  
    { wch: 15 }, // SKU
    { wch: 15 }, // Código de Barras
    { wch: 20 }, // Fragancia
    { wch: 12 }, // Categoría ID
    { wch: 10 }, // Unidad ID
    { wch: 15 }, // Tipo Producto
    { wch: 18 }, // Tipo Variante
    { wch: 10 }, // Tamaño
    { wch: 12 }, // Valor Tamaño
    { wch: 20 }, // Marca
    { wch: 10 }, // Género
    { wch: 12 }, // Stock Actual
    { wch: 12 }, // Stock Mínimo
    { wch: 12 }, // Precio Compra
    { wch: 12 }, // Precio Venta
    { wch: 15 }, // Precio Sugerido
    { wch: 12 }, // Proveedor ID
    { wch: 40 }  // Notas
  ];

  XLSX.utils.book_append_sheet(wb, wsInventory, 'INVENTARIO_REAL');

  // Hoja de resumen estadístico
  const statsData = [
    ['RESUMEN FINANCIERO DEL INVENTARIO'],
    [''],
    ['💰 INVERSIÓN TOTAL:', `$${inventoryResult.statistics.totalInvertido.toLocaleString()}`],
    ['💵 VALOR DE VENTA:', `$${inventoryResult.statistics.valorTotalVenta.toLocaleString()}`],
    ['📈 GANANCIA ESTIMADA:', `$${inventoryResult.statistics.gananciaEstimada.toLocaleString()}`],
    ['📊 MARGEN DE GANANCIA:', `${inventoryResult.statistics.margenGanancia.toFixed(1)}%`],
    ['📦 TOTAL UNIDADES:', inventoryResult.statistics.totalUnidades],
    ['🏷️ PRODUCTOS DIFERENTES:', inventoryResult.statistics.totalProductos],
    ['🚨 PRODUCTOS CON STOCK BAJO:', inventoryResult.statistics.stockBajo],
    [''],
    ['TOP 5 INVERSIONES:'],
    ...inventoryResult.statistics.topInversiones.map((p, i) => [
      `${i + 1}. ${p.nombre}:`, `$${p.inversion.toLocaleString()}`
    ])
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(wb, wsStats, 'RESUMEN_FINANCIERO');

  // Guardar archivo
  const fileName = 'inventario-con-datos-reales.xlsx';
  XLSX.writeFile(wb, fileName);
  
  console.log('');
  console.log(`✅ Excel con datos reales creado: ${fileName}`);
  console.log('');
  console.log('🎯 PRÓXIMOS PASOS:');
  console.log('   1. Revisar el archivo Excel creado');
  console.log('   2. Modificar cantidades según tu inventario real');
  console.log('   3. Cargar con: POST /api/products/upload-excel');
  console.log('   4. Ver estadísticas en: GET /api/products/statistics');
  console.log('   5. Ver valor invertido en: GET /api/products/inventory-value');
  
  return fileName;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  try {
    createFilledExcel();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Asegúrate de tener instalado xlsx: npm install xlsx');
  }
}

module.exports = { createRealInventoryData, createFilledExcel };
