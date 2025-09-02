export enum SupplierType {
  // Tipos por especialidad de producto
  ESENCIAS = 'ESENCIAS',
  FRASCOS = 'FRASCOS',
  ORIGINALES = 'ORIGINALES',
  LOCIONES = 'LOCIONES',
  CREMAS = 'CREMAS',
  MIXTO = 'MIXTO',
  
  // Tipos por modelo de negocio
  DISTRIBUIDOR = 'DISTRIBUIDOR',
  FABRICANTE = 'FABRICANTE',
  IMPORTADOR = 'IMPORTADOR',
  LOCAL = 'LOCAL'
}

export const SUPPLIER_TYPE_DESCRIPTIONS = {
  [SupplierType.ESENCIAS]: 'Especializado en esencias aromáticas',
  [SupplierType.FRASCOS]: 'Proveedor de frascos y envases',
  [SupplierType.ORIGINALES]: 'Perfumes originales de marca',
  [SupplierType.LOCIONES]: 'Lociones corporales y splash',
  [SupplierType.CREMAS]: 'Cremas y productos cosméticos',
  [SupplierType.MIXTO]: 'Múltiples tipos de productos',
  [SupplierType.DISTRIBUIDOR]: 'Distribuidor de múltiples marcas',
  [SupplierType.FABRICANTE]: 'Fabricante de productos propios',
  [SupplierType.IMPORTADOR]: 'Importador de productos internacionales',
  [SupplierType.LOCAL]: 'Proveedor local de la región'
};

export const SUPPLIER_TYPE_CATEGORIES = {
  [SupplierType.ESENCIAS]: ['Esencias', 'Fijador', 'Alcohol'],
  [SupplierType.FRASCOS]: ['Frascos', 'Envases', 'Atomizadores', 'Estuches'],
  [SupplierType.ORIGINALES]: ['Perfumes Originales', 'Perfumes de Marca'],
  [SupplierType.LOCIONES]: ['Lociones', 'Splash', 'Aerosoles'],
  [SupplierType.CREMAS]: ['Cremas', 'Cosméticos', 'Cuidado Personal'],
  [SupplierType.MIXTO]: ['Múltiples categorías'],
  [SupplierType.DISTRIBUIDOR]: ['Distribución General'],
  [SupplierType.FABRICANTE]: ['Fabricación Propia'],
  [SupplierType.IMPORTADOR]: ['Importación'],
  [SupplierType.LOCAL]: ['Proveedor Regional']
};
