# Sistema de Feature Flags Multi-Tenant

Sistema de feature flags que permite activar/desactivar funcionalidades específicas por cliente (tenant) sin afectar a los demás.

## 📋 Casos de Uso

- **Cliente Joyería**: Necesita módulos de reparaciones, seguimiento de peso en oro, especificaciones de diamantes
- **Cliente Perfumería**: No necesita ver ni usar funcionalidades de joyería
- **Cliente Restaurante**: Podría necesitar módulos de mesas, comandas, etc.

## 🏗️ Arquitectura

### Backend (NestJS + Prisma)

#### Modelos de Base de Datos

1. **Feature**: Catálogo global de features disponibles
   - `code`: Identificador único (ej: 'JEWELRY_MODULE')
   - `name`: Nombre descriptivo
   - `module`: Módulo al que pertenece
   - `featureType`: MODULE | FIELD | REPORT | INTEGRATION

2. **TenantFeature**: Activación de features por tenant
   - `tenantId`: ID del cliente
   - `featureCode`: Código del feature
   - `isEnabled`: Si está activado
   - `configuration`: JSON con configuración específica

3. **TenantCustomField**: Campos personalizados por tenant
   - `tenantId`: ID del cliente
   - `module`: Módulo (PRODUCTS, SALES, etc.)
   - `fieldName`: Nombre técnico del campo
   - `fieldLabel`: Etiqueta visible
   - `fieldType`: text | number | select | date | boolean

#### Endpoints API

```typescript
// Features globales (solo admins)
POST   /features                           // Crear feature global
GET    /features                           // Listar todos los features
GET    /features/code/:code                // Obtener feature por código

// Features por tenant
GET    /features/tenant/:tenantId          // Listar features del tenant
GET    /features/tenant/:tenantId/summary  // Resumen completo (features + custom fields)
GET    /features/tenant/:tenantId/has/:featureCode  // Verificar si tiene feature
POST   /features/tenant/enable             // Activar feature
PUT    /features/tenant/:tenantId/disable/:featureCode  // Desactivar feature

// Campos personalizados
GET    /features/custom-fields/:tenantId/:module  // Campos por módulo
POST   /features/custom-fields             // Crear campo personalizado
PUT    /features/custom-fields/:id         // Actualizar campo
DELETE /features/custom-fields/:id         // Eliminar campo
```

#### Proteger Endpoints con Feature Flags

```typescript
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';

@Controller('jewelry')
@UseGuards(JwtAuthGuard, FeatureGuard)
export class JewelryController {
  
  @Get('repairs')
  @RequireFeature('JEWELRY_REPAIRS')
  getRepairs() {
    // Solo accesible si el tenant tiene JEWELRY_REPAIRS activado
  }
}
```

### Frontend (React + Redux)

#### Redux Slice

```typescript
// store/slices/tenantFeaturesSlice.ts
// Ya está integrado en el store principal
```

#### Hook personalizado

```typescript
import { useFeatures } from '../hooks/useFeatures';

function MyComponent() {
  const { hasFeature, getFeatureConfig, getCustomFields, loading } = useFeatures();
  
  // Verificar si tiene feature
  if (hasFeature('JEWELRY_MODULE')) {
    return <JewelrySection />;
  }
  
  // Obtener configuración
  const config = getFeatureConfig('JEWELRY_MODULE');
  
  // Obtener campos personalizados
  const customFields = getCustomFields('PRODUCTS');
  
  return <StandardSection />;
}
```

#### Componente FeatureGuard

```typescript
import { FeatureGuard } from '../components/common/FeatureGuard';

function App() {
  return (
    <>
      {/* Mostrar solo si tiene el feature */}
      <FeatureGuard feature="JEWELRY_MODULE">
        <JewelryMenu />
      </FeatureGuard>
      
      {/* Con fallback */}
      <FeatureGuard 
        feature="JEWELRY_MODULE" 
        fallback={<div>Esta funcionalidad no está disponible</div>}
      >
        <JewelryContent />
      </FeatureGuard>
    </>
  );
}
```

#### Componente DynamicFields

```typescript
import { DynamicFields } from '../components/common/DynamicFields';

function ProductForm() {
  return (
    <Form>
      <Form.Item label="Nombre" name="name">
        <Input />
      </Form.Item>
      
      <Form.Item label="Precio" name="price">
        <InputNumber />
      </Form.Item>
      
      {/* Campos personalizados del tenant */}
      <DynamicFields module="PRODUCTS" />
    </Form>
  );
}
```

## 🚀 Setup Inicial

### 1. Crear Features Globales y Configurar Tenant de Joyería

```bash
# En backend-perfumeria/
node scripts/seed-jewelry-features.js
```

Este script:
- ✅ Crea 10 features globales de joyería
- ✅ Busca el tenant con `industry = 'JEWELRY'`
- ✅ Activa features para ese tenant
- ✅ Crea 7 campos personalizados (quilates, peso, claridad, etc.)

### 2. Configurar un Tenant como Joyería

Si aún no tienes un tenant de joyería, actualiza uno existente:

```sql
UPDATE "CompanyConfig" 
SET 
  industry = 'JEWELRY',
  tenant_code = 'JEWELRY_001',
  tenant_name = 'Mi Joyería'
WHERE id = 1;
```

### 3. Asignar TenantId a Usuarios

```sql
UPDATE "User" 
SET tenant_id = 1
WHERE id IN (SELECT id FROM "User" WHERE email LIKE '%joyeria%');
```

## 📝 Ejemplos Prácticos

### Ejemplo 1: Menú Condicional

```typescript
// src/components/DynamicSidebarMenu.tsx
import { useFeatures } from '../hooks/useFeatures';

export const DynamicSidebarMenu = () => {
  const { hasFeature } = useFeatures();
  
  return (
    <Menu>
      <Menu.Item key="dashboard">Dashboard</Menu.Item>
      <Menu.Item key="products">Productos</Menu.Item>
      <Menu.Item key="sales">Ventas</Menu.Item>
      
      {/* Solo para joyerías */}
      {hasFeature('JEWELRY_MODULE') && (
        <SubMenu key="jewelry" title="Joyería">
          <Menu.Item key="repairs">Reparaciones</Menu.Item>
          <Menu.Item key="appraisals">Valuaciones</Menu.Item>
        </SubMenu>
      )}
    </Menu>
  );
};
```

### Ejemplo 2: Formulario con Campos Personalizados

```typescript
// src/components/products/ProductForm.tsx
import { DynamicFields } from '../common/DynamicFields';

export const ProductForm = () => {
  const [form] = Form.useForm();
  
  const handleSubmit = (values: any) => {
    console.log('Standard fields:', values);
    console.log('Custom fields:', values.customFields);
    // Guardar en backend
  };
  
  return (
    <Form form={form} onFinish={handleSubmit}>
      {/* Campos estándar */}
      <Form.Item label="Nombre" name="name">
        <Input />
      </Form.Item>
      
      <Form.Item label="Precio" name="price">
        <InputNumber />
      </Form.Item>
      
      {/* Campos dinámicos según tenant */}
      <DynamicFields module="PRODUCTS" />
      
      <Button type="primary" htmlType="submit">Guardar</Button>
    </Form>
  );
};
```

### Ejemplo 3: Rutas Protegidas

```typescript
// src/router/index.tsx
import { FeatureGuard } from '../components/common/FeatureGuard';
import { JewelryRepairs } from '../pages/JewelryRepairs';

export const routes = [
  {
    path: '/products',
    element: <Products />
  },
  {
    path: '/jewelry/repairs',
    element: (
      <FeatureGuard 
        feature="JEWELRY_REPAIRS"
        fallback={<Navigate to="/dashboard" />}
      >
        <JewelryRepairs />
      </FeatureGuard>
    )
  }
];
```

## 🎯 Features Disponibles para Joyería

| Código | Nombre | Tipo | Descripción |
|--------|--------|------|-------------|
| `JEWELRY_MODULE` | Módulo de Joyería | MODULE | Funcionalidades generales de joyería |
| `JEWELRY_REPAIRS` | Reparaciones | MODULE | Sistema de órdenes de reparación |
| `GOLD_WEIGHT_TRACKING` | Control de Peso en Oro | FIELD | Seguimiento de peso en gramos |
| `DIAMOND_SPECS` | Especificaciones de Diamantes | FIELD | Quilates, claridad, color, corte |
| `JEWELRY_CUSTOM_ORDERS` | Pedidos Personalizados | MODULE | Diseños a medida |
| `CERTIFICATE_MANAGEMENT` | Gestión de Certificados | FIELD | Certificados de autenticidad |
| `JEWELRY_APPRAISAL` | Valuación de Joyas | MODULE | Sistema de avalúos |
| `CONSIGNMENT_SALES` | Ventas por Consignación | MODULE | Productos en consignación |
| `METAL_PRICE_TRACKING` | Precio de Metales | INTEGRATION | Cotización automática |
| `WHATSAPP_INTEGRATION` | Integración WhatsApp | INTEGRATION | Mensajería automática |

## 🔧 Administración

### Crear un Feature Global

```typescript
POST /features
{
  "code": "NEW_FEATURE",
  "name": "Nueva Funcionalidad",
  "description": "Descripción del feature",
  "module": "CUSTOM",
  "featureType": "MODULE",
  "isActive": true
}
```

### Activar Feature para un Tenant

```typescript
POST /features/tenant/enable
{
  "tenantId": 1,
  "featureCode": "JEWELRY_MODULE",
  "configuration": {
    "maxRepairs": 100,
    "autoNotify": true
  }
}
```

### Crear Campo Personalizado

```typescript
POST /features/custom-fields
{
  "tenantId": 1,
  "module": "PRODUCTS",
  "fieldName": "goldKarat",
  "fieldLabel": "Quilates de Oro",
  "fieldType": "select",
  "fieldOptions": {
    "options": [
      { "value": "10k", "label": "10K" },
      { "value": "14k", "label": "14K" },
      { "value": "18k", "label": "18K" }
    ]
  },
  "isRequired": false,
  "order": 1
}
```

## ✅ Checklist de Implementación

### Backend
- [x] Modelos Prisma (Feature, TenantFeature, TenantCustomField)
- [x] FeaturesService con todos los métodos CRUD
- [x] DTOs con validaciones
- [x] FeaturesController con endpoints
- [x] FeaturesModule registrado en AppModule
- [x] FeatureGuard para proteger endpoints
- [x] @RequireFeature decorator
- [x] Script de seed para joyería

### Frontend
- [x] Redux slice (tenantFeaturesSlice)
- [x] Hook useFeatures()
- [x] Componente FeatureGuard
- [x] Componente DynamicFields
- [ ] Integrar en menú lateral
- [ ] Integrar en formularios
- [ ] Integrar en rutas

## 🎉 Próximos Pasos

1. **Ejecutar seed**: `node scripts/seed-jewelry-features.js`
2. **Configurar tenant de joyería** en base de datos
3. **Integrar en frontend**: Menú, formularios, rutas
4. **Crear módulos específicos**: JewelryRepairs, Appraisals, etc.
5. **Testing**: Probar con diferentes tenants

## 💡 Notas Importantes

- Los features se cargan automáticamente al iniciar sesión (hook useFeatures)
- Los custom fields se obtienen dinámicamente por módulo
- Backend valida permisos en cada request (FeatureGuard)
- Frontend oculta UI que el tenant no tiene acceso
- Un tenant puede tener múltiples features activados
- Cada feature puede tener su propia configuración JSON
