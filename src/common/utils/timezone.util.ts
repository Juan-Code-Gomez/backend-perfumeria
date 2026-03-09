/**
 * Utilidades para manejo correcto de fechas y zonas horarias
 *
 * IMPORTANTE - Por qué este enfoque:
 * Railway (y muchos servidores cloud) corren en UTC por defecto.
 * Colombia está en UTC-5 (sin horario de verano).
 *
 * Sin este fix, una venta registrada a las 7:05 PM hora Colombia
 * se almacena como 2026-03-10T00:05:00Z (¡día siguiente en UTC!),
 * y el cierre de caja de "2026-03-09" no la encuentra porque
 * su rango es 2026-03-09T00:00:00Z → 2026-03-09T23:59:59Z.
 *
 * La solución: todas las consultas por "día" usan UTC equivalente
 * a medianoche Colombia → fin del día Colombia:
 *   Colombia midnight 00:00 = UTC 05:00
 *   Colombia end-of-day 23:59:59 = UTC 04:59:59 del día siguiente
 */

// Colombia es UTC-5 sin horario de verano → offset fijo de 5 horas
const COLOMBIA_UTC_OFFSET_HOURS = 5;

/**
 * Convierte una fecha string (YYYY-MM-DD) a Date representando el mediodía Colombia
 * De esta forma la fecha siempre cae dentro del día correcto independientemente del servidor.
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

  // Para fechas simples YYYY-MM-DD, construir en UTC con offset Colombia
  // Mediodía Colombia (12:00 UTC-5) = 17:00 UTC → claramente dentro del día local
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses en JS son 0-indexed
    const day = parseInt(parts[2]);
    return new Date(Date.UTC(year, month, day, 12 + COLOMBIA_UTC_OFFSET_HOURS, 0, 0, 0));
  }

  // Fallback: parseo normal
  return new Date(dateString);
}

/**
 * Inicio del día en horario Colombia expresado en UTC.
 * Medianoche Colombia (00:00 UTC-5) = 05:00 UTC.
 *
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date al inicio del día Colombia (en UTC)
 */
export function startOfDay(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // 00:00:00.000 Colombia = 05:00:00.000 UTC
  return new Date(Date.UTC(year, month - 1, day, COLOMBIA_UTC_OFFSET_HOURS, 0, 0, 0));
}

/**
 * Fin del día en horario Colombia expresado en UTC.
 * 23:59:59.999 Colombia = 04:59:59.999 UTC del día SIGUIENTE.
 *
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date al final del día Colombia (en UTC)
 */
export function endOfDay(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // 23:59:59.999 Colombia = día+1 04:59:59.999 UTC
  return new Date(Date.UTC(year, month - 1, day + 1, COLOMBIA_UTC_OFFSET_HOURS, 0, 0, 0) - 1);
}

/**
 * Devuelve el inicio y fin del día actual en horario Colombia (UTC-5).
 * Útil para queries que no reciben fecha explícita.
 */
export function todayRangeColombia(): { startOfDay: Date; endOfDay: Date } {
  // Hora actual en UTC, convertida a Colombia restando 5h
  const nowUtc = new Date();
  const nowColombia = new Date(nowUtc.getTime() - COLOMBIA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const dateStr = nowColombia.toISOString().split('T')[0]; // YYYY-MM-DD en Colombia
  return {
    startOfDay: startOfDay(dateStr),
    endOfDay: endOfDay(dateStr),
  };
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
