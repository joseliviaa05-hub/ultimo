/**
 * Normaliza texto para comparaciones
 */
export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Formatea texto para display
 */
export function formatearTexto(texto: string | null | undefined): string {
  if (!texto) return '';
  
  return texto
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Limpia texto para búsqueda
 */
export function limpiarTexto(texto: string): string {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Extrae primer número de un texto
 */
export function extraerNumero(texto: string): number | null {
  const match = texto.match(/\d+/);
  return match ?  parseInt(match[0], 10) : null;
}

/**
 * Extrae todos los números de un texto
 */
export function extraerNumeros(texto: string): number[] {
  const matches = texto.match(/\d+/g);
  return matches ? matches.map((n) => parseInt(n, 10)) : [];
}

/**
 * Trunca texto con ellipsis
 */
export function truncarTexto(texto: string, maxLength: number = 50): string {
  if (!texto || texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + '...';
}

/**
 * Valida si un texto es un número de teléfono de WhatsApp
 */
export function esTelefono(texto: string): boolean {
  return /^\d{10,15}@c\.us$/.test(texto);
}

/**
 * Limpia número de teléfono
 */
export function limpiarTelefono(telefono: string): string {
  return telefono.replace('@c.us', ''). replace(/\D/g, '');
}