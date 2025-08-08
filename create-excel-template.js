// Generador de template Excel para carga masiva de productos
// Este script crea un archivo de ejemplo que muestra la estructura

const XLSX = require('xlsx');

function createProductExcelTemplate() {
  // Datos de ejemplo para el template
  const templateData = [
    {
      'Nombre': 'Esencia Chanel No 5',
      'Descripción': 'Esencia clásica femenina floral aldeídica',
      'SKU': 'ESN-CH5-30',
      'Código de Barras': '7501234567890',
      'Fragancia': 'Chanel No 5',
      'Categoría ID': 1,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'ESENCIA',
      'Tamaño': '30ml',
      'Valor Tamaño': 30,
      'Marca': 'Chanel Inspired',
      'Género': 'FEMENINO',
      'Stock': 75,
      'Stock Mínimo': 15,
      'Precio Compra': 9500,
      'Precio Venta': 17000,
      'Precio Sugerido': 20000,
      'Precio Mínimo': 15000,
      'Precio Máximo': 25000,
      'Proveedor ID': 1,
      'Código Proveedor': 'CH5-ESN-30',
      'Requiere Preparación': 'true',
      'Es Compuesto': 'false',
      'Tags': 'esencia,femenino,chanel,clásico,floral',
      'Notas': 'Esencia de alta calidad para preparación con alcohol'
    },
    {
      'Nombre': 'Frasco Cristal 100ml Transparente',
      'Descripción': 'Frasco de cristal con atomizador dorado',
      'SKU': 'FRS-100-CRI',
      'Código de Barras': '7501234567891',
      'Fragancia': '',
      'Categoría ID': 2,
      'Unidad ID': 2,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'FRASCO',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': 'Premium Glass',
      'Género': 'UNISEX',
      'Stock': 120,
      'Stock Mínimo': 25,
      'Precio Compra': 4500,
      'Precio Venta': 8000,
      'Precio Sugerido': 9000,
      'Precio Mínimo': 7000,
      'Precio Máximo': 12000,
      'Proveedor ID': 2,
      'Código Proveedor': 'GL-100-TR',
      'Requiere Preparación': 'false',
      'Es Compuesto': 'false',
      'Tags': 'frasco,cristal,100ml,transparente,premium',
      'Notas': 'Frasco de alta calidad con atomizador dorado'
    },
    {
      'Nombre': 'Perfume 1.1 Hugo Boss Bottled',
      'Descripción': 'Perfume armado similar al original Hugo Boss',
      'SKU': 'PRF-HBB-100',
      'Código de Barras': '7501234567892',
      'Fragancia': 'Hugo Boss Bottled',
      'Categoría ID': 5,
      'Unidad ID': 1,
      'Tipo Producto': 'COMPOSITE',
      'Tipo Variante': 'PERFUME_11',
      'Tamaño': '100ml',
      'Valor Tamaño': 100,
      'Marca': 'Hugo Boss Inspired',
      'Género': 'MASCULINO',
      'Stock': 18,
      'Stock Mínimo': 4,
      'Precio Compra': 32000,
      'Precio Venta': 60000,
      'Precio Sugerido': 70000,
      'Precio Mínimo': 55000,
      'Precio Máximo': 80000,
      'Proveedor ID': 1,
      'Código Proveedor': 'HBB-PRF-100',
      'Requiere Preparación': 'true',
      'Es Compuesto': 'true',
      'Tags': 'perfume,1.1,masculino,hugo boss,armado',
      'Notas': 'Perfume compuesto: esencia + alcohol + fijador + frasco'
    },
    {
      'Nombre': 'Splash Versace Bright Crystal',
      'Descripción': 'Splash corporal femenino floral frutal',
      'SKU': 'SPL-VBC-250',
      'Código de Barras': '7501234567893',
      'Fragancia': 'Bright Crystal',
      'Categoría ID': 3,
      'Unidad ID': 1,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'SPLASH',
      'Tamaño': '250ml',
      'Valor Tamaño': 250,
      'Marca': 'Versace Inspired',
      'Género': 'FEMENINO',
      'Stock': 35,
      'Stock Mínimo': 8,
      'Precio Compra': 13500,
      'Precio Venta': 24000,
      'Precio Sugerido': 28000,
      'Precio Mínimo': 22000,
      'Precio Máximo': 35000,
      'Proveedor ID': 3,
      'Código Proveedor': 'VBC-SPL-250',
      'Requiere Preparación': 'false',
      'Es Compuesto': 'false',
      'Tags': 'splash,femenino,versace,floral,frutal',
      'Notas': 'Splash corporal de larga duración con aroma floral'
    },
    {
      'Nombre': 'Crema Corporal Tommy Girl',
      'Descripción': 'Crema hidratante con fragancia Tommy Girl',
      'SKU': 'CRM-TG-200',
      'Código de Barras': '7501234567894',
      'Fragancia': 'Tommy Girl',
      'Categoría ID': 4,
      'Unidad ID': 3,
      'Tipo Producto': 'SIMPLE',
      'Tipo Variante': 'CREMA',
      'Tamaño': '200g',
      'Valor Tamaño': 200,
      'Marca': 'Tommy Hilfiger Inspired',
      'Género': 'FEMENINO',
      'Stock': 22,
      'Stock Mínimo': 6,
      'Precio Compra': 16000,
      'Precio Venta': 28000,
      'Precio Sugerido': 32000,
      'Precio Mínimo': 25000,
      'Precio Máximo': 40000,
      'Proveedor ID': 4,
      'Código Proveedor': 'TG-CRM-200',
      'Requiere Preparación': 'false',
      'Es Compuesto': 'false',
      'Tags': 'crema,hidratante,femenino,tommy girl,corporal',
      'Notas': 'Crema nutritiva con absorción rápida y fragancia duradera'
    }
  ];

  // Hoja de instrucciones
  const instructionsData = [
    ['INSTRUCCIONES PARA CARGA MASIVA DE PRODUCTOS'],
    [''],
    ['CAMPOS OBLIGATORIOS:'],
    ['- Nombre: Nombre del producto'],
    ['- Categoría ID: ID de la categoría (debe existir en el sistema)'],
    ['- Unidad ID: ID de la unidad de medida (debe existir en el sistema)'],
    ['- Stock: Cantidad en inventario'],
    ['- Precio Compra: Precio de compra del producto'],
    ['- Precio Venta: Precio de venta del producto'],
    [''],
    ['TIPOS DE PRODUCTO:'],
    ['- SIMPLE: Producto básico sin variantes'],
    ['- VARIANT: Variante de otro producto (esencia vs perfume 1.1)'],
    ['- COMPOSITE: Producto compuesto (requiere otros productos para armarse)'],
    [''],
    ['TIPOS DE VARIANTE:'],
    ['- ESENCIA: Esencias concentradas'],
    ['- PERFUME_11: Perfumes armados similares a originales'],
    ['- SPLASH: Splashs corporales'],
    ['- SPLASH_ESCARCHADO: Splashs con partículas escarchadas'],
    ['- CREMA: Cremas corporales'],
    ['- AEROSOL: Aerosoles'],
    ['- FRASCO: Frascos y envases'],
    [''],
    ['GÉNEROS:'],
    ['- MASCULINO: Para hombres'],
    ['- FEMENINO: Para mujeres'],
    ['- UNISEX: Para ambos géneros'],
    [''],
    ['CAMPOS BOOLEANOS (true/false):'],
    ['- Requiere Preparación: Si el producto necesita ser preparado'],
    ['- Es Compuesto: Si el producto está formado por otros productos'],
    [''],
    ['TAGS:'],
    ['- Separar por comas: esencia,masculino,fresco'],
    ['- Útiles para búsquedas y filtros'],
    [''],
    ['NOTAS IMPORTANTES:'],
    ['- Los IDs de Categoría, Unidad y Proveedor deben existir en el sistema'],
    ['- El SKU debe ser único si se especifica'],
    ['- Los precios deben ser números positivos'],
    ['- El stock puede ser decimal para productos vendidos por peso'],
    [''],
    ['EJEMPLO DE USO:'],
    ['1. Completar la hoja "Productos" con los datos'],
    ['2. Guardar como archivo Excel (.xlsx)'],
    ['3. Usar el endpoint POST /api/products/upload-excel'],
    ['4. El sistema validará y creará los productos']
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Agregar hoja de productos
  const wsProducts = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos');

  // Agregar hoja de instrucciones
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

  // Guardar archivo
  XLSX.writeFile(wb, 'template-productos-perfumeria.xlsx');
  
  console.log('✅ Template Excel creado: template-productos-perfumeria.xlsx');
  console.log('📋 El archivo contiene:');
  console.log('   - Hoja "Productos": Ejemplos de productos para cargar');
  console.log('   - Hoja "Instrucciones": Guía completa de uso');
  console.log('');
  console.log('🔧 Para usar el template:');
  console.log('   1. Editar los datos en la hoja "Productos"');
  console.log('   2. Asegurar que las categorías, unidades y proveedores existan');
  console.log('   3. Usar POST /api/products/upload-excel para cargar');
  console.log('');
  console.log('💡 Campos importantes para perfumería:');
  console.log('   - Fragancia: Agrupa esencias con perfumes 1.1');
  console.log('   - Tipo Variante: ESENCIA, PERFUME_11, SPLASH, etc.');
  console.log('   - Requiere Preparación: true para esencias y compuestos');
  console.log('   - Es Compuesto: true para perfumes que se arman');
}

// Ejecutar si el archivo se ejecuta directamente
if (require.main === module) {
  try {
    createProductExcelTemplate();
  } catch (error) {
    console.error('❌ Error creando template:', error.message);
    console.log('💡 Asegúrate de tener instalado xlsx: npm install xlsx');
  }
}

module.exports = { createProductExcelTemplate };
