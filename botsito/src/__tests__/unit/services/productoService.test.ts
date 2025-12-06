import productoService from '../../../services/producto.service';
import { cleanDatabase, createTestProducto, faker, disconnectPrisma } from '../../helpers';
import { Categoria } from '@prisma/client';

describe('ProductoService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('obtenerPorId', () => {
    it('debe retornar producto existente', async () => {
      const producto = await createTestProducto({
        nombre: 'Cuaderno A4',
        categoria: 'LIBRERIA',
        precio: 1500,
      });

      const resultado = await productoService.obtenerPorId(producto.id);

      expect(resultado).not.toBeNull();
      expect(resultado?.nombre).toBe('Cuaderno A4');
      expect(Number(resultado?.precio)).toBe(1500);
    });

    it('debe retornar null si producto no existe', async () => {
      const resultado = await productoService.obtenerPorId('id-inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('obtenerPorCategoria', () => {
    it('debe retornar productos de una categoría', async () => {
      await createTestProducto({ categoria: 'LIBRERIA', nombre: 'Cuaderno', stock: true });
      await createTestProducto({ categoria: 'LIBRERIA', nombre: 'Lápiz', stock: true });
      await createTestProducto({ categoria: 'COTILLON', nombre: 'Globo', stock: true });

      const resultado = await productoService.obtenerPorCategoria('LIBRERIA');

      expect(resultado). toHaveLength(2);
      expect(resultado.every((p: any) => p.categoria === 'LIBRERIA')).toBe(true);
    });

    it('debe retornar array vacío si no hay productos', async () => {
      const resultado = await productoService.obtenerPorCategoria('JUGUETERIA');

      expect(resultado).toEqual([]);
    });
  });

  describe('buscar', () => {
    it('debe buscar productos por nombre', async () => {
      await createTestProducto({ nombre: 'Cuaderno Rivadavia', stock: true });
      await createTestProducto({ nombre: 'Cuaderno Gloria', stock: true });
      await createTestProducto({ nombre: 'Lápiz Negro', stock: true });

      const resultado = await productoService.buscar('cuaderno');

      expect(resultado).toHaveLength(2);
      expect(resultado. every((p: any) => p.nombre.toLowerCase().includes('cuaderno'))). toBe(true);
    });

    it('debe ser case-insensitive', async () => {
      await createTestProducto({ nombre: 'LAPIZ NEGRO', stock: true });

      const resultado = await productoService.buscar('lapiz');

      expect(resultado).toHaveLength(1);
    });
  });

  describe('obtenerTodos', () => {
    it('debe retornar lista paginada de productos', async () => {
      // Crear 5 productos y verificar
      const productos = [];
      for (let i = 0; i < 5; i++) {
        const prod = await createTestProducto({ 
          nombre: `Producto Test ${i}`,
          categoria: 'LIBRERIA',
          precio: 100 + i,
          stock: true,
        });
        productos.push(prod);
      }

      // Verificar que se crearon
      expect(productos).toHaveLength(5);

      const resultado = await productoService.obtenerTodos(1, 10);

      expect(resultado.data). toHaveLength(5);
      expect(resultado.pagination.total).toBe(5);
      expect(resultado.pagination.page). toBe(1);
    });

    it('debe respetar límite de paginación', async () => {
      // Crear 10 productos
      for (let i = 0; i < 10; i++) {
        await createTestProducto({ 
          nombre: `Producto Lim ${i}`,
          categoria: 'COTILLON',
          precio: 200 + i,
        });
      }

      const resultado = await productoService.obtenerTodos(1, 5);

      expect(resultado.data). toHaveLength(5);
      expect(resultado.pagination.totalPages).toBe(2);
      expect(resultado.pagination.hasMore).toBe(true);
    });
  });

  describe('crear', () => {
    it('debe crear un nuevo producto', async () => {
      const data = {
        nombre: 'Producto Test',
        categoria: 'LIBRERIA' as Categoria,
        subcategoria: 'papeleria',
        precio: 500,
        stock: true,
      };

      const producto = await productoService.crear(data);

      expect(producto. nombre).toBe('Producto Test');
      expect(producto.categoria).toBe('LIBRERIA');
      expect(Number(producto.precio)).toBe(500);
    });
  });

  describe('actualizar', () => {
    it('debe actualizar un producto existente', async () => {
      const producto = await createTestProducto({ nombre: 'Original', precio: 100 });

      const actualizado = await productoService.actualizar(producto.id, {
        nombre: 'Actualizado',
        precio: 200,
      });

      expect(actualizado?. nombre).toBe('Actualizado');
      expect(Number(actualizado?.precio)).toBe(200);
    });
  });

  describe('eliminar', () => {
    it('debe eliminar un producto', async () => {
      const producto = await createTestProducto();

      await productoService.eliminar(producto.id);

      const verificar = await productoService.obtenerPorId(producto.id);
      expect(verificar).toBeNull();
    });
  });
});