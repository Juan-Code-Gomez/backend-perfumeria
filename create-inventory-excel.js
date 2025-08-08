// Generador de Excel específico para inventario de perfumería real
// Basado en el contexto del negocio y los proveedores existentes

const XLSX = require('xlsx');

function createInventoryExcelTemplate() {
  console.log('📋 Creando Excel para inventario real de perfumería...');

  // Template con estructura real de inventario
  const inventoryTemplate = [
    // ESENCIAS - Las más comunes en perfumería
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
      'Stock Actual': 0,
      'Stock Mínimo': 5,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': 'Anotar cantidad real del inventario físico'
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
      'Stock Actual': 0,
      'Stock Mínimo': 5,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': ''
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
      'Stock Actual': 0,
      'Stock Mínimo': 5,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': ''
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
      'Stock Actual': 0,
      'Stock Mínimo': 5,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': ''
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
      'Stock Actual': 0,
      'Stock Mínimo': 5,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': ''
    },

    // PERFUMES 1.1 - Los más vendidos
    {
      'Nombre': 'Perfume 1.1 Chanel No 5 100ml',
      'Descripción': 'Perfume armado similar al original',
      'SKU': 'PRF-CH5-100',
      'Código de Barras': '',
      'Fragancia': 'Chanel No 5',
      'Categoría ID': 2,
      'Unidad ID': 1,
      'Tipo Producto': 'VARIANT',
      'Tipo Variante': 'PERFUME_11',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': 'Chanel Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 0,
      'Stock Mínimo': 2,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': ''
    },
    {
      'Nombre': 'Perfume 1.1 Acqua di Gio 100ml',
      'Descripción': 'Perfume armado masculino',
      'SKU': 'PRF-ADG-100',
      'Código de Barras': '',
      'Fragancia': 'Acqua di Gio',
      'Categoría ID': 2,
      'Unidad ID': 1,
      'Tipo Producto': 'VARIANT',
      'Tipo Variante': 'PERFUME_11',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': 'Giorgio Armani Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 0,
      'Stock Mínimo': 2,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': ''
    },

    // FRASCOS
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
      'Stock Actual': 0,
      'Stock Mínimo': 10,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 2,
      'Notas': ''
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
      'Stock Actual': 0,
      'Stock Mínimo': 10,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 2,
      'Notas': ''
    },

    // SPLASHS
    {
      'Nombre': 'Splash Carolina Herrera Good Girl',
      'Descripción': 'Splash corporal femenino',
      'SKU': 'SPL-GG-250',
      'Código de Barras': '',
      'Fragancia': 'Good Girl',
      'Categoría ID': 4,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'SPLASH',
      'Tamaño': '250ml',
      'Valor Tamaño': 250,
      'Marca': 'Carolina Herrera Inspired',
      'Género': 'FEMENINO',
      'Stock Actual': 0,
      'Stock Mínimo': 3,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 3,
      'Notas': ''
    },
    {
      'Nombre': 'Splash Escarchado Polo Blue',
      'Descripción': 'Splash con partículas escarchadas',
      'SKU': 'SPL-PB-ESC-250',
      'Código de Barras': '',
      'Fragancia': 'Polo Blue',
      'Categoría ID': 4,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'SPLASH_ESCARCHADO',
      'Tamaño': '250ml',
      'Valor Tamaño': 250,
      'Marca': 'Ralph Lauren Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 0,
      'Stock Mínimo': 3,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 3,
      'Notas': ''
    },

    // CREMAS
    {
      'Nombre': 'Crema Hidratante Coco Chanel',
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
      'Stock Actual': 0,
      'Stock Mínimo': 2,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 4,
      'Notas': ''
    },

    // AEROSOLES
    {
      'Nombre': 'Aerosol Antitranspirante Axe',
      'Descripción': 'Aerosol masculino',
      'SKU': 'AER-AXE-150',
      'Código de Barras': '',
      'Fragancia': 'Axe Dark Temptation',
      'Categoría ID': 6,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'AEROSOL',
      'Tamaño': '150ml',
      'Valor Tamaño': 150,
      'Marca': 'Axe Inspired',
      'Género': 'MASCULINO',
      'Stock Actual': 0,
      'Stock Mínimo': 5,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 3,
      'Notas': ''
    },

    // INSUMOS PARA PREPARACIÓN
    {
      'Nombre': 'Alcohol Etílico 70%',
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
      'Stock Actual': 0,
      'Stock Mínimo': 2,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': 'Insumo para preparación'
    },
    {
      'Nombre': 'Fijador Concentrado',
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
      'Stock Actual': 0,
      'Stock Mínimo': 1,
      'Precio Compra': 0,
      'Precio Venta': 0,
      'Precio Sugerido': 0,
      'Proveedor ID': 1,
      'Notas': 'Insumo para preparación'
    }
  ];

  // Hoja de instrucciones específicas para inventario
  const instructionsData = [
    ['INSTRUCCIONES PARA INVENTARIO FÍSICO'],
    [''],
    ['🎯 OBJETIVO:'],
    ['Digitalizar el inventario físico escrito a mano'],
    ['Calcular valor total invertido en productos'],
    ['Establecer stock mínimos para reposición'],
    [''],
    ['📋 CÓMO COMPLETAR:'],
    ['1. STOCK ACTUAL: Contar físicamente cada producto'],
    ['2. PRECIO COMPRA: El precio que pagaste al proveedor'],
    ['3. PRECIO VENTA: El precio al que vendes normalmente'],
    ['4. PRECIO SUGERIDO: Precio objetivo (opcional)'],
    [''],
    ['💰 CÁLCULOS AUTOMÁTICOS QUE HARÁ EL SISTEMA:'],
    ['- Valor total invertido = Stock × Precio Compra'],
    ['- Valor total del inventario al precio de venta'],
    ['- Ganancia potencial = (Precio Venta - Precio Compra) × Stock'],
    ['- Productos con stock bajo (menor al mínimo)'],
    [''],
    ['🔢 CAMPOS IMPORTANTES:'],
    ['- Stock Actual: DEBE SER NÚMERO (ejemplo: 15, 2.5, 0)'],
    ['- Precio Compra: DEBE SER NÚMERO (ejemplo: 8500, 12000)'],
    ['- Precio Venta: DEBE SER NÚMERO (ejemplo: 15000, 25000)'],
    ['- Stock Mínimo: Cuando reposar (ejemplo: 5, 2)'],
    [''],
    ['📦 TIPOS DE PRODUCTOS EN TU NEGOCIO:'],
    ['- ESENCIA: Para preparar perfumes (se mide en ml/gramos)'],
    ['- PERFUME_11: Perfumes ya armados similares a originales'],
    ['- SPLASH: Splashs corporales'],
    ['- SPLASH_ESCARCHADO: Splashs con brillos'],
    ['- CREMA: Cremas corporales'],
    ['- AEROSOL: Aerosoles y desodorantes'],
    ['- FRASCO: Frascos y envases'],
    [''],
    ['🏷️ PROVEEDORES (usar Proveedor ID):'],
    ['1 = Fragancias Milano (Esencias)'],
    ['2 = Envases Premium (Frascos)'],
    ['3 = Cosméticos Naturales (Splashs, Aerosoles)'],
    ['4 = Distribuidora Total (Mixto)'],
    [''],
    ['✅ PASOS PARA USAR:'],
    ['1. Completar columnas de Stock Actual y Precios'],
    ['2. Revisar que no haya celdas vacías en campos obligatorios'],
    ['3. Guardar archivo como Excel (.xlsx)'],
    ['4. Usar endpoint POST /api/products/upload-excel'],
    ['5. Revisar estadísticas financieras en /api/products/statistics'],
    [''],
    ['🚨 IMPORTANTE:'],
    ['- NO dejar celdas de precio vacías (usar 0 si no aplica)'],
    ['- Verificar que Stock Actual sea correcto'],
    ['- Los SKU deben ser únicos'],
    ['- Puedes agregar más filas copiando el formato']
  ];

  // Hoja de referencia de categorías y unidades
  const referenceData = [
    ['REFERENCIA DE CATEGORÍAS Y UNIDADES'],
    [''],
    ['CATEGORÍAS (usar ID):'],
    ['1 = Esencias'],
    ['2 = Perfumes 1.1'],
    ['3 = Frascos'],
    ['4 = Splahs'],
    ['5 = Cremas'],
    ['6 = Aerosoles'],
    ['7 = Alcohol/Fijador'],
    ['8 = Feromonas'],
    ['9 = Combos'],
    ['10 = Duos'],
    ['11 = Estuches'],
    [''],
    ['UNIDADES (usar ID):'],
    ['1 = Mililitros (ml) - Para líquidos'],
    ['2 = Unidades (und) - Para frascos, perfumes'],
    ['3 = Gramos (g) - Para cremas, polvos'],
    ['4 = Onzas (oz) - Para medidas especiales'],
    [''],
    ['GÉNEROS:'],
    ['MASCULINO = Para hombres'],
    ['FEMENINO = Para mujeres'],
    ['UNISEX = Para ambos'],
    [''],
    ['TIPOS DE VARIANTE:'],
    ['ESENCIA = Esencias concentradas'],
    ['PERFUME_11 = Perfumes armados'],
    ['SPLASH = Splashs normales'],
    ['SPLASH_ESCARCHADO = Splashs con escarcha'],
    ['CREMA = Cremas corporales'],
    ['AEROSOL = Aerosoles'],
    ['FRASCO = Envases y frascos']
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Agregar hoja principal de inventario
  const wsInventory = XLSX.utils.json_to_sheet(inventoryTemplate);
  
  // Hacer más anchas las columnas importantes
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
    { wch: 30 }  // Notas
  ];

  XLSX.utils.book_append_sheet(wb, wsInventory, 'INVENTARIO');

  // Agregar hoja de instrucciones
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'INSTRUCCIONES');

  // Agregar hoja de referencia
  const wsReference = XLSX.utils.aoa_to_sheet(referenceData);
  XLSX.utils.book_append_sheet(wb, wsReference, 'REFERENCIA');

  // Guardar archivo
  const fileName = 'inventario-perfumeria-real.xlsx';
  XLSX.writeFile(wb, fileName);
  
  console.log(`✅ Excel de inventario creado: ${fileName}`);
  console.log('');
  console.log('📋 CONTENIDO DEL ARCHIVO:');
  console.log('   📊 Hoja "INVENTARIO": Template con productos comunes');
  console.log('   📖 Hoja "INSTRUCCIONES": Guía paso a paso');
  console.log('   🔍 Hoja "REFERENCIA": IDs de categorías y unidades');
  console.log('');
  console.log('🎯 CÓMO USARLO:');
  console.log('   1. Abrir Excel y ir a hoja "INVENTARIO"');
  console.log('   2. Completar "Stock Actual" con tu inventario físico');
  console.log('   3. Completar "Precio Compra" y "Precio Venta"');
  console.log('   4. Agregar más productos copiando filas');
  console.log('   5. Guardar y cargar con POST /api/products/upload-excel');
  console.log('');
  console.log('💰 VALOR INVERTIDO:');
  console.log('   El sistema calculará automáticamente:');
  console.log('   - Valor total compra = Σ(Stock × Precio Compra)');
  console.log('   - Valor total venta = Σ(Stock × Precio Venta)');
  console.log('   - Ganancia potencial = Valor Venta - Valor Compra');
  console.log('');
  console.log(`📁 Archivo guardado como: ${fileName}`);

  return fileName;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  try {
    createInventoryExcelTemplate();
  } catch (error) {
    console.error('❌ Error creando Excel:', error.message);
    console.log('💡 Asegúrate de tener instalado xlsx: npm install xlsx');
  }
}

module.exports = { createInventoryExcelTemplate };
