// API Response Messages
export const MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'Registro creado exitosamente',
    UPDATED: 'Registro actualizado exitosamente', 
    DELETED: 'Registro eliminado exitosamente',
    RETRIEVED: 'Datos obtenidos exitosamente',
    OPERATION_COMPLETED: 'Operación completada exitosamente',
  },

  // Error messages
  ERROR: {
    NOT_FOUND: 'Registro no encontrado',
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    INVALID_DATA: 'Datos inválidos',
    DUPLICATE_ENTRY: 'Ya existe un registro con esos datos',
    INSUFFICIENT_STOCK: 'Stock insuficiente',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    INTERNAL_ERROR: 'Error interno del servidor',
  },

  // Business messages
  BUSINESS: {
    LOW_STOCK: 'Stock bajo detectado',
    SALE_COMPLETED: 'Venta realizada exitosamente',
    PURCHASE_COMPLETED: 'Compra registrada exitosamente',
    PAYMENT_PROCESSED: 'Pago procesado exitosamente',
    INVENTORY_UPDATED: 'Inventario actualizado',
  },
};

// Business Rules
export const BUSINESS_RULES = {
  MIN_STOCK_DEFAULT: 5,
  MAX_DISCOUNT_PERCENTAGE: 50,
  DECIMAL_PLACES: 2,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Movement Types
export const MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT', 
  ADJUST: 'ADJUST',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'EFECTIVO',
  CARD: 'TARJETA',
  TRANSFER: 'TRANSFERENCIA',
  CREDIT: 'CREDITO',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  VIEWER: 'VIEWER',
} as const;

// Expense Categories
export const EXPENSE_CATEGORIES = {
  SERVICIOS: 'SERVICIOS',
  SUMINISTROS: 'SUMINISTROS', 
  ALQUILER: 'ALQUILER',
  OTRO: 'OTRO',
} as const;
