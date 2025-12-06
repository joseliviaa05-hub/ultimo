import {
  normalizarTexto,
  formatearTexto,
  limpiarTexto,
  extraerNumero,
  extraerNumeros,
  truncarTexto,
  esTelefono,
  limpiarTelefono,
} from '../../../utils/textHelpers';

describe('textHelpers', () => {
  describe('normalizarTexto', () => {
    it('debe convertir a minúsculas', () => {
      expect(normalizarTexto('HOLA MUNDO')).toBe('hola_mundo');
    });

    it('debe remover acentos', () => {
      expect(normalizarTexto('café')).toBe('cafe');
      expect(normalizarTexto('niño')).toBe('nino');
    });

    it('debe reemplazar espacios por underscores', () => {
      expect(normalizarTexto('hola mundo')).toBe('hola_mundo');
    });

    it('debe manejar múltiples espacios', () => {
      expect(normalizarTexto('hola    mundo')).toBe('hola_mundo');
    });

    it('debe remover underscores al inicio y fin', () => {
      expect(normalizarTexto('_hola_')).toBe('hola');
    });

    it('debe manejar null y undefined', () => {
      expect(normalizarTexto(null as any)).toBe('');
      expect(normalizarTexto(undefined as any)).toBe('');
    });
  });

  describe('formatearTexto', () => {
    it('debe capitalizar palabras', () => {
      expect(formatearTexto('hola_mundo')).toBe('Hola Mundo');
    });

    it('debe reemplazar underscores por espacios', () => {
      expect(formatearTexto('producto_test')).toBe('Producto Test');
    });

    it('debe manejar null y undefined', () => {
      expect(formatearTexto(null as any)).toBe('');
      expect(formatearTexto(undefined as any)).toBe('');
    });
  });

  describe('limpiarTexto', () => {
    it('debe convertir a minúsculas y remover acentos', () => {
      expect(limpiarTexto('Café Con Leche')).toBe('cafe con leche');
    });

    it('debe hacer trim', () => {
      expect(limpiarTexto('  hola  ')).toBe('hola');
    });
  });

  describe('extraerNumero', () => {
    it('debe extraer el primer número de un texto', () => {
      expect(extraerNumero('Quiero 5 productos')).toBe(5);
      expect(extraerNumero('Dame 10 cuadernos')).toBe(10);
    });

    it('debe retornar null si no hay números', () => {
      expect(extraerNumero('Hola mundo')).toBeNull();
    });

    it('debe extraer el primer número aunque haya varios', () => {
      expect(extraerNumero('Quiero 5 de esto y 10 de aquello')).toBe(5);
    });
  });

  describe('extraerNumeros', () => {
    it('debe extraer todos los números', () => {
      expect(extraerNumeros('Quiero 5 de esto y 10 de aquello')).toEqual([5, 10]);
    });

    it('debe retornar array vacío si no hay números', () => {
      expect(extraerNumeros('Hola mundo')).toEqual([]);
    });
  });

  describe('truncarTexto', () => {
    it('debe truncar texto largo', () => {
      const texto = 'Este es un texto muy largo que debe ser truncado';
      expect(truncarTexto(texto, 20)).toBe('Este es un texto muy...');
    });

    it('no debe truncar texto corto', () => {
      expect(truncarTexto('Hola', 10)).toBe('Hola');
    });

    it('debe usar 50 como longitud por defecto', () => {
      const texto = 'a'.repeat(60);
      expect(truncarTexto(texto)). toHaveLength(53); // 50 + '...'
    });
  });

  describe('esTelefono', () => {
    it('debe validar formato de teléfono de WhatsApp', () => {
      expect(esTelefono('5491112345678@c.us')).toBe(true);
    });

    it('debe rechazar formatos inválidos', () => {
      expect(esTelefono('5491112345678')).toBe(false);
      expect(esTelefono('hola@c.us')).toBe(false);
      expect(esTelefono('')).toBe(false);
    });
  });

  describe('limpiarTelefono', () => {
    it('debe remover @c.us', () => {
      expect(limpiarTelefono('5491112345678@c.us')).toBe('5491112345678');
    });

    it('debe remover caracteres no numéricos', () => {
      expect(limpiarTelefono('+54 9 11 1234-5678')).toBe('5491112345678');
    });
  });
});