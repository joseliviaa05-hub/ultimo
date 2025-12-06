/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTO SERVICE - Gestión de productos con cache
 * ═══════════════════════════════════════════════════════════════
 */

import { prisma } from './prisma.service';
import { Categoria, Producto } from '@prisma/client';
import cacheService from './cache.service';

// TTL en segundos
const CACHE_TTL = {
  PRODUCTO: 3600,        // 1 hora
  CATALOGO: 1800,        // 30 minutos
  CATEGORIA: 3600,       // 1 hora
  BUSQUEDA: 600,         // 10 minutos
  DESTACADOS: 7200,      // 2 horas
};

export class ProductoService {
  /**
   * Obtener todas las categorías disponibles (con cache)
   */
  async obtenerCategorias(): Promise<string[]> {
    const cacheKey = 'productos:categorias';

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const categorias = await prisma.producto.findMany({
          select: { categoria: true },
          distinct: ['categoria'],
        });

        return categorias.map((c) => c.categoria);
      },
      CACHE_TTL.CATEGORIA
    );
  }

  /**
   * Obtener productos por categoría (con cache)
   */
  async obtenerPorCategoria(categoria: string) {
    const cacheKey = `productos:categoria:${categoria}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await prisma.producto.findMany({
          where: {
            categoria: categoria as Categoria,
            stock: true,
          },
          include: {
            imagenes: {
              take: 1,
              orderBy: { orden: 'asc' },
            },
          },
          orderBy: { nombre: 'asc' },
        });
      },
      CACHE_TTL. CATEGORIA
    );
  }

  /**
   * Buscar productos por texto (con cache)
   */
  async buscar(texto: string) {
    const cacheKey = `productos:buscar:${texto.toLowerCase()}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await prisma. producto.findMany({
          where: {
            OR: [
              { nombre: { contains: texto, mode: 'insensitive' } },
              { subcategoria: { contains: texto, mode: 'insensitive' } },
            ],
            stock: true,
          },
          include: {
            imagenes: {
              take: 1,
              orderBy: { orden: 'asc' },
            },
          },
          take: 10,
        });
      },
      CACHE_TTL. BUSQUEDA
    );
  }

  /**
   * Obtener producto por ID (con cache)
   */
  async obtenerPorId(id: string) {
    const cacheKey = `producto:${id}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await prisma. producto.findUnique({
          where: { id },
          include: {
            imagenes: true,
          },
        });
      },
      CACHE_TTL.PRODUCTO
    );
  }

  /**
   * Obtener producto por nombre (aproximado) - con cache
   */
  async obtenerPorNombre(nombre: string) {
    const cacheKey = `producto:nombre:${nombre. toLowerCase()}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await prisma.producto.findFirst({
          where: {
            nombre: {
              contains: nombre,
              mode: 'insensitive',
            },
          },
          include: {
            imagenes: {
              take: 1,
              orderBy: { orden: 'asc' },
            },
          },
        });
      },
      CACHE_TTL.PRODUCTO
    );
  }

  /**
   * Obtener lista paginada de productos (con cache)
   */
  async obtenerTodos(page: number = 1, limit: number = 10) {
    const cacheKey = `productos:pagina:${page}:${limit}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const [productos, total] = await Promise.all([
          prisma. producto.findMany({
            skip,
            take: limit,
            include: {
              imagenes: {
                take: 1,
                orderBy: { orden: 'asc' },
              },
            },
            orderBy: {
              nombre: 'asc',
            },
          }),
          prisma.producto.count(),
        ]);

        return {
          data: productos,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        };
      },
      CACHE_TTL.CATALOGO
    );
  }

  /**
   * Crear nuevo producto (invalidar cache)
   */
  async crear(data: {
    nombre: string;
    categoria: Categoria;
    subcategoria: string;
    precio: number;
    precioDesde?: number;
    unidad?: string;
    stock?: boolean;
    codigoBarras?: string;
  }) {
    const producto = await prisma. producto.create({
      data: {
        nombre: data.nombre,
        categoria: data.categoria,
        subcategoria: data.subcategoria,
        precio: data.precio,
        precioDesde: data.precioDesde,
        unidad: data.unidad,
        stock: data.stock ?? true,
        codigoBarras: data.codigoBarras,
      },
    });

    // Invalidar caches relacionados
    await this.invalidarCaches();

    return producto;
  }

  /**
   * Actualizar producto existente (invalidar cache)
   */
  async actualizar(
    id: string,
    data: Partial<{
      nombre: string;
      categoria: Categoria;
      subcategoria: string;
      precio: number;
      precioDesde: number;
      unidad: string;
      stock: boolean;
      codigoBarras: string;
    }>
  ) {
    const producto = await prisma.producto. update({
      where: { id },
      data,
    });

    // Invalidar caches relacionados
    await cacheService.del(`producto:${id}`);
    await this.invalidarCaches();

    return producto;
  }

  /**
   * Eliminar producto (invalidar cache)
   */
  async eliminar(id: string) {
    const producto = await prisma.producto. delete({
      where: { id },
    });

    // Invalidar caches relacionados
    await cacheService.del(`producto:${id}`);
    await this.invalidarCaches();

    return producto;
  }

  /**
   * Verificar stock de un producto (con cache corto)
   */
  async verificarStock(productoId: string): Promise<boolean> {
    const cacheKey = `producto:stock:${productoId}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const producto = await prisma.producto.findUnique({
          where: { id: productoId },
          select: { stock: true },
        });

        return producto?.stock || false;
      },
      300 // 5 minutos (TTL corto para stock)
    );
  }

  /**
   * Obtener productos destacados (más vendidos) - con cache
   */
  async obtenerDestacados(limit: number = 10) {
    const cacheKey = `productos:destacados:${limit}`;

    return await cacheService. getOrSet(
      cacheKey,
      async () => {
        // Obtener IDs de productos más vendidos
        const productosMasVendidos = await prisma.itemPedido. groupBy({
          by: ['productoId'],
          _sum: {
            cantidad: true,
          },
          orderBy: {
            _sum: {
              cantidad: 'desc',
            },
          },
          take: limit,
        });

        const productosIds = productosMasVendidos.map((p) => p.productoId);

        if (productosIds.length === 0) {
          // Si no hay ventas, retornar productos aleatorios
          return await prisma.producto.findMany({
            where: { stock: true },
            take: limit,
            include: {
              imagenes: {
                take: 1,
                orderBy: { orden: 'asc' },
              },
            },
          });
        }

        return await prisma.producto.findMany({
          where: {
            id: { in: productosIds },
            stock: true,
          },
          include: {
            imagenes: {
              take: 1,
              orderBy: { orden: 'asc' },
            },
          },
        });
      },
      CACHE_TTL.DESTACADOS
    );
  }

  /**
   * Obtener catálogo completo agrupado por categoría (con cache)
   */
  async obtenerCatalogo() {
    const cacheKey = 'catalogo:completo';

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const productos = await prisma.producto.findMany({
          where: { stock: true },
          include: {
            imagenes: {
              take: 1,
              orderBy: { orden: 'asc' },
            },
          },
          orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
        });

        // Agrupar por categoría
        const catalogo: Record<string, any[]> = {};

        productos.forEach((producto) => {
          if (!catalogo[producto.categoria]) {
            catalogo[producto. categoria] = [];
          }
          catalogo[producto.categoria]. push(producto);
        });

        return catalogo;
      },
      CACHE_TTL. CATALOGO
    );
  }

  /**
   * Invalidar todos los caches de productos
   */
  private async invalidarCaches(): Promise<void> {
    await Promise.all([
      cacheService.delPattern('productos:*'),
      cacheService.delPattern('catalogo:*'),
      cacheService.delPattern('producto:nombre:*'),
      cacheService.del('productos:categorias'),
    ]);
  }

  /**
   * Limpiar cache manualmente (para admin)
   */
  async limpiarCache(): Promise<void> {
    await this.invalidarCaches();
    console.log('✅ Cache de productos limpiado');
  }

  /**
   * Obtener estadísticas de cache (para debugging)
   */
  async obtenerEstadisticasCache(): Promise<{
    productosEnCache: number;
    categoriasEnCache: number;
    busquedasEnCache: number;
  }> {
    const [productos, categorias, busquedas] = await Promise.all([
      cacheService.exists('productos:*'),
      cacheService.exists('productos:categoria:*'),
      cacheService.exists('productos:buscar:*'),
    ]);

    return {
      productosEnCache: productos ? 1 : 0,
      categoriasEnCache: categorias ? 1 : 0,
      busquedasEnCache: busquedas ? 1 : 0,
    };
  }
}

export default new ProductoService();