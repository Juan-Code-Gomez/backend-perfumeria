# Opciones para Manejo de Logos Multi-Tenant

## Opción 1: Base64 en Base de Datos ⭐ (RECOMENDADA)
```typescript
// Backend - ya implementado
async uploadLogoBase64(base64Logo: string) {
  const updatedConfig = await this.updateCurrent({ logo: base64Logo });
  return { logoUrl: base64Logo, config: updatedConfig };
}

// Frontend - Login.tsx
const logoSrc = config?.logo?.startsWith('data:') 
  ? config.logo 
  : (config?.logo || "/logo-milan.png");
```

**Ventajas:**
- ✅ Cada cliente tiene su logo independiente
- ✅ No hay conflictos de archivos
- ✅ Fácil de implementar
- ✅ Perfecto para multi-tenant

**Desventajas:**
- ❌ Logos grandes aumentan el tamaño de DB
- ❌ Transferencia más lenta

---

## Opción 2: Archivos con Hash Único
```typescript
// Backend - Generar nombre único por cliente
uploadLogo(file: Express.Multer.File, clientId: string) {
  const hash = crypto.createHash('md5').update(clientId + Date.now()).digest('hex');
  const filename = `logo-${hash}-${clientId}${path.extname(file.originalname)}`;
  // Guardar en carpeta con nombre único
}
```

**Ventajas:**
- ✅ Archivos separados por cliente
- ✅ Mejor rendimiento que base64
- ✅ Fácil de cachear

**Desventajas:**
- ❌ Requiere limpieza de archivos huérfanos
- ❌ Más complejo de implementar

---

## Opción 3: AWS S3 con Carpetas por Cliente
```typescript
// Backend
const s3Key = `logos/${clientId}/company-logo.png`;
await s3.upload({
  Bucket: 'perfumeria-logos',
  Key: s3Key,
  Body: file.buffer
});
```

**Ventajas:**
- ✅ Escalable infinitamente
- ✅ CDN automático
- ✅ No consume espacio local

**Desventajas:**
- ❌ Requiere AWS/costos adicionales
- ❌ Dependencia externa

---

## Opción 4: Subdominio con Archivos Locales
```typescript
// Cada cliente accede via subdominio
// cliente1.perfumeria.com -> /uploads/cliente1/logo.png
// cliente2.perfumeria.com -> /uploads/cliente2/logo.png
```

**Ventajas:**
- ✅ Completamente aislado
- ✅ Fácil de organizar

**Desventajas:**
- ❌ Requiere configuración de DNS
- ❌ Más complejo de desplegar

---

## Recomendación Final

Para tu caso específico (multi-tenant, misma rama, diferentes BD), 
la **Opción 1 (Base64)** es perfecta porque:

1. ✅ Zero configuración adicional
2. ✅ Funciona inmediatamente
3. ✅ Cada cliente completamente independiente
4. ✅ No requiere servicios externos
5. ✅ Fácil de respaldar con la BD

El único "problema" es que logos muy grandes (>500KB) pueden ser lentos,
pero para logos de empresa típicos (50-200KB) es perfecto.