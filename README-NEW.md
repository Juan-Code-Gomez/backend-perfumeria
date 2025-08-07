# 🏪 Sistema de Gestión para Perfumería

Sistema profesional de gestión para perfumería desarrollado con NestJS, PostgreSQL y Prisma. Diseñado para automatizar y sistematizar operaciones de negocio con reportes financieros avanzados.

## 🚀 Funcionalidades Principales

### 📊 Dashboard Avanzado
- **Métricas en Tiempo Real**: Ventas del día, productos vendidos, ganancias
- **Análisis de Rentabilidad**: Cálculo automático de márgenes por producto
- **Productos Menos Rentables**: Identificación para optimización de precios
- **Indicadores Clave**: ROI, margen promedio, productos con bajo stock

### 📈 Reportes Financieros
- **Inventario Valorizado**: Valoración del stock actual por diferentes métodos
- **Cuentas por Cobrar/Pagar**: Gestión de deudas con clientes y proveedores  
- **Análisis ABC**: Clasificación de productos por importancia económica
- **Reportes de Ganancias**: Análisis de rentabilidad por períodos

### 🛍️ Gestión de Operaciones
- **Productos**: CRUD completo con categorías, proveedores y control de stock
- **Ventas**: Sistema completo con múltiples métodos de pago y créditos
- **Compras**: Control de inventario con actualización automática de stock
- **Clientes**: Gestión de clientes con historial de compras y créditos
- **Gastos**: Categorización y control de gastos operativos

### 🔒 Seguridad y Administración
- **Autenticación JWT**: Sistema seguro con roles y permisos
- **Validación de Datos**: Validación estricta en todos los endpoints
- **Manejo de Errores**: Sistema profesional de manejo de excepciones
- **Logging Avanzado**: Registro detallado para auditoría y debugging

## 🛠️ Tecnologías

- **Backend Framework**: NestJS (Node.js/TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT + bcrypt
- **Validación**: class-validator + class-transformer
- **Seguridad**: Rate limiting, CORS, sanitización de datos
- **Documentación**: Swagger/OpenAPI

## ⚡ Instalación Rápida

1. **Clonar repositorio**
   ```bash
   git clone <repo-url>
   cd backend-perfumeria
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Configurar base de datos**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npx prisma db seed  # Opcional: datos de prueba
   ```

5. **Iniciar servidor**
   ```bash
   npm run start:dev
   ```

## 📋 API Endpoints

### 🔐 Autenticación
```http
POST /api/auth/register      # Registro de usuario
POST /api/auth/login         # Inicio de sesión
```

### 📊 Dashboard y Reportes
```http
GET /api/dashboard/summary                    # Dashboard principal
GET /api/dashboard/rentabilidad              # Análisis de rentabilidad
GET /api/dashboard/productos-menos-rentables # Productos a optimizar

GET /api/reports/inventario-valorizado       # Valoración del inventario
GET /api/reports/cuentas-por-cobrar-pagar   # Estado de cuentas
GET /api/reports/analisis-abc               # Clasificación ABC de productos
GET /api/reports/ganancias-periodo          # Análisis de ganancias
```

### 🛍️ Operaciones Comerciales
```http
# Productos
GET    /api/products              # Listar productos
POST   /api/products              # Crear producto
PUT    /api/products/:id          # Actualizar producto
DELETE /api/products/:id          # Eliminar producto
GET    /api/products/alerts/low-stock  # Alertas de stock bajo

# Ventas
GET    /api/sales                 # Listar ventas
POST   /api/sales                 # Crear venta
GET    /api/sales/:id             # Detalle de venta
POST   /api/sales/:id/payments    # Agregar pago

# Clientes
GET    /api/clients               # Listar clientes
POST   /api/clients               # Crear cliente
GET    /api/clients/:id           # Detalle de cliente

# Compras
GET    /api/purchases             # Listar compras
POST   /api/purchases             # Registrar compra

# Gastos
GET    /api/expenses              # Listar gastos
POST   /api/expenses              # Registrar gasto
```

## 🗃️ Modelo de Datos

### Entidades Principales
- **Users**: Usuarios del sistema con roles
- **Products**: Catálogo de productos con precios y stock
- **Categories**: Categorización de productos
- **Suppliers**: Proveedores con información de contacto
- **Clients**: Clientes con historial crediticio
- **Sales/SaleItems**: Ventas con detalles de productos
- **Purchases**: Compras a proveedores
- **Expenses**: Gastos operativos categorizados
- **CashClosing**: Cierres de caja diarios

### Relaciones Clave
- Productos ↔ Categorías (Many-to-One)
- Ventas ↔ Clientes (Many-to-One)
- Ventas ↔ Items (One-to-Many)
- Compras ↔ Proveedores (Many-to-One)

## 🚀 Scripts de Desarrollo

```bash
# Desarrollo
npm run start:dev          # Servidor en modo desarrollo
npm run build             # Construcción para producción
npm run start:prod        # Servidor en producción

# Base de datos
npx prisma studio         # Interface gráfica de BD
npx prisma migrate dev    # Nueva migración
npx prisma generate       # Regenerar cliente

# Testing
npm run test             # Tests unitarios
npm run test:e2e         # Tests de integración
npm run test:cov         # Cobertura de tests

# Linting
npm run lint             # Verificar código
npm run lint:fix         # Corregir errores automáticamente
```

## ⚙️ Configuración de Producción

### Variables de Entorno Críticas
```env
# Base de datos
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Seguridad
JWT_SECRET="your-super-secret-key"
BCRYPT_ROUNDS=12

# Negocio
PERFUMERIA_NOMBRE="Mi Perfumería"
STOCK_MINIMO_DEFAULT=10
MARGEN_GANANCIA_DEFAULT=0.30
```

### Optimizaciones de Producción
- Caching de consultas frecuentes
- Rate limiting configurado
- Logs estructurados
- Manejo de errores centralizado
- Validación estricta de datos

## 📊 Métricas y Monitoring

El sistema incluye:
- **Logs estructurados** con niveles configurables
- **Métricas de performance** en endpoints críticos
- **Alertas automáticas** para stock bajo
- **Auditoría completa** de operaciones

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas comerciales:
- 📧 Email: [tu-email@dominio.com]
- 📱 WhatsApp: [tu-numero]
- 🌐 Website: [tu-website.com]

---

**Desarrollado con ❤️ para optimizar la gestión de perfumerías**
