/**
 * Utilidades para manejo correcto de fechas y zonas horarias
 * Solución al problema de desfase de fechas en servidores con zona horaria diferente
 */

/**
 * Convierte una fecha string (YYYY-MM-DD) a Date sin interpretación UTC
 * Usa la zona horaria local del servidor de forma consistente
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 * @returns Date object con la fecha correcta
 */
export function parseLocalDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }

  // Si viene con hora completa (ISO), parsear directamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  // Para fechas simples YYYY-MM-DD, construir manualmente para evitar UTC
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses en JS son 0-indexed
    const day = parseInt(parts[2]);
    
    // Crear fecha en la zona horaria local del servidor
    return new Date(year, month, day, 12, 0, 0); // 12:00 para evitar problemas de cambio de día
  }

  // Fallback: parseo normal
  return new Date(dateString);
}

/**
 * Convierte un string de fecha a inicio del día (00:00:00)
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date al inicio del día
 */
export function startOfDay(dateString: string): Date {
  const date = parseLocalDate(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Convierte un string de fecha a fin del día (23:59:59.999)
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date al final del día
 */
export function endOfDay(dateString: string): Date {
  const date = parseLocalDate(dateString);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Convierte Date a string YYYY-MM-DD en zona horaria local
 * 
 * @param date - Date object
 * @returns String en formato YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha actual en zona horaria local (sin hora)
 * 
 * @returns Date a las 12:00:00 del día actual
 */
export function getTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}
