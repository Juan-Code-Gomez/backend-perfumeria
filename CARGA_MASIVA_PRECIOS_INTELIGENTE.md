# Sistema de Carga Masiva con Precios Inteligentes 💰

## Descripción del Cambio Implementado

Se implementó un sistema **inteligente** para el manejo de precios de venta en la carga masiva de productos. Ahora el sistema funciona de la siguiente manera:

### 🎯 Nueva Lógica de Precios

#### 1. **Si el Excel TIENE precio de venta**
- ✅ **Se usa el precio exacto del Excel**
- 💰 No se aplica ningún margen automático
- 📝 Log: `"💰 Usando precio de venta del Excel para [Producto]: $[Precio]"`

#### 2. **Si el Excel NO TIENE precio de venta (vacío, 0, nulo)**
- 🤖 **Se calcula automáticamente usando márgenes**
- 📊 Para "Perfumes 1.1": `Precio Venta = Precio Compra × 1.80` (80% rentabilidad)
- 📊 Para otras categorías: `Precio Venta = Precio Compra × 1.60` (60% rentabilidad)
- 📝 Log: `"📊 Precio calculado automáticamente para [Producto]: Compra $[X] -> Venta $[Y] ([%] rentabilidad)"`

### 🔍 Validaciones del Campo "Precio venta"

El sistema considera que **NO HAY precio de venta** en estos casos:
- ❌ Campo vacío (sin contenido)
- ❌ Valor `0`
- ❌ Valor `null` o `undefined`
- ❌ Texto que no se puede convertir a número
- ❌ Números negativos

El sistema considera que **SÍ HAY precio de venta** cuando:
- ✅ Es un número válido
- ✅ Es mayor que 0
- ✅ Ejemplo: `15000`, `25500.50`, `12000`

## 📊 Formato del Excel de Carga Masiva

### Columnas Obligatorias
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Nombre producto` | Nombre del producto | "Perfume Black XS 100ml" |
| `Categoría` | Categoría existente | "Perfumes 1.1" |
| `Unidad` | Unidad de medida | "Mililitros" |
| `Precio compra` | Precio de compra (OBLIGATORIO) | `12000` |

### Columnas Opcionales
| Columna | Descripción | Comportamiento |
|---------|-------------|----------------|
| `Precio venta` | Precio de venta | **Si está lleno**: usa ese precio<br>**Si está vacío**: calcula automáticamente |
| `Stock inicial` | Stock inicial | Si no se especifica = 0 |
| `Proveedor` | Solo si `withSupplier = true` | Crear compras asociadas |

### 💡 Ejemplos Prácticos

#### Ejemplo 1: Excel CON precios de venta específicos
```
Nombre producto          | Categoría    | Unidad      | Precio compra | Precio venta
Perfume Black XS 100ml   | Perfumes 1.1 | Mililitros  | 15000        | 28000
Esencia Invictus 30ml    | Esencias     | Mililitros  | 8000         | 15000
Splash Good Girl 250ml   | Splashs      | Mililitros  | 12000        | 22000
```
**Resultado**: Se usarán exactamente los precios `28000`, `15000`, y `22000`.

#### Ejemplo 2: Excel SIN precios de venta (automático)
```
Nombre producto          | Categoría    | Unidad      | Precio compra | Precio venta
Perfume Black XS 100ml   | Perfumes 1.1 | Mililitros  | 15000        | 
Esencia Invictus 30ml    | Esencias     | Mililitros  | 8000         | 0
Splash Good Girl 250ml   | Splashs      | Mililitros  | 12000        | 
```
**Resultado**:
- Perfume: `15000 × 1.80 = 27000` (80% rentabilidad)
- Esencia: `8000 × 1.60 = 12800` (60% rentabilidad) 
- Splash: `12000 × 1.60 = 19200` (60% rentabilidad)

#### Ejemplo 3: Excel MIXTO (algunos con precio, otros automáticos)
```
Nombre producto          | Categoría    | Unidad      | Precio compra | Precio venta
Perfume Black XS 100ml   | Perfumes 1.1 | Mililitros  | 15000        | 30000
Esencia Invictus 30ml    | Esencias     | Mililitros  | 8000         | 
Splash Good Girl 250ml   | Splashs      | Mililitros  | 12000        | 25000
```
**Resultado**:
- Perfume: `30000` (del Excel)
- Esencia: `8000 × 1.60 = 12800` (calculado automáticamente)
- Splash: `25000` (del Excel)

## 🛠️ Implementación Técnica

### Archivos Modificados
- `src/products/products.service.ts`
  - `bulkUploadWithSupplier()`: Líneas ~580-610
  - `bulkUploadWithoutSupplier()`: Líneas ~757-785

### Logs del Sistema
El sistema genera logs claros para identificar qué precios se usan:

```bash
💰 Usando precio de venta del Excel para "Perfume Black XS 100ml": $30000
📊 Precio calculado automáticamente para "Esencia Invictus": Compra $8000 -> Venta $12800.00 (60% rentabilidad)
📊 Precio calculado automáticamente para "Perfume Invictus 100ml": Compra $15000 -> Venta $27000.00 (80% rentabilidad)
⚠️ Usando precio de compra como precio de venta para "Producto sin precio"
```

## 🎯 Beneficios del Nuevo Sistema

1. **Flexibilidad Total**: Puedes mezclar productos con precios específicos y otros automáticos
2. **Control de Márgenes**: Para productos especiales, defines el precio exacto
3. **Automatización**: Para productos estándar, el sistema calcula automáticamente
4. **Transparencia**: Los logs muestran exactamente qué precio se aplicó y por qué
5. **Compatibilidad**: Funciona tanto con carga con proveedores como sin proveedores

## 🚀 Cómo Usar

1. **Crea tu Excel** con las columnas requeridas
2. **Llena "Precio venta"** solo para productos con precios específicos
3. **Deja vacío "Precio venta"** para productos que quieres que se calculen automáticamente
4. **Carga el archivo** usando la funcionalidad de carga masiva
5. **Revisa los logs** para confirmar que los precios se aplicaron correctamente

---

**¡El sistema ahora es completamente inteligente y flexible para manejar cualquier escenario de pricing!** 🎉
