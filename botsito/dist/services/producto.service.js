"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTO SERVICE - Gestión de productos
 * ═══════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductoService = void 0;
const prisma_service_1 = require("./prisma.service");
class ProductoService {
    /**
     * Obtener todas las categorías disponibles
     */
    async obtenerCategorias() {
        const categorias = await prisma_service_1.prisma.producto.findMany({
            select: { categoria: true },
            distinct: ['categoria'],
        });
        return categorias.map((c) => c.categoria);
    }
    /**
     * Obtener productos por categoría
     */
    async obtenerPorCategoria(categoria) {
        return await prisma_service_1.prisma.producto.findMany({
            where: {
                categoria: categoria,
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
    }
    /**
     * Buscar productos por texto
     */
    async buscar(texto) {
        return await prisma_service_1.prisma.producto.findMany({
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
    }
    /**
     * Obtener producto por ID
     */
    async obtenerPorId(id) {
        return await prisma_service_1.prisma.producto.findUnique({
            where: { id },
            include: {
                imagenes: true,
            },
        });
    }
    /**
     * Obtener producto por nombre (aproximado)
     */
    async obtenerPorNombre(nombre) {
        return await prisma_service_1.prisma.producto.findFirst({
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
    }
    /**
     * Verificar stock de un producto
     */
    async verificarStock(productoId) {
        const producto = await prisma_service_1.prisma.producto.findUnique({
            where: { id: productoId },
            select: { stock: true },
        });
        return producto?.stock || false;
    }
    /**
     * Obtener productos destacados (más vendidos)
     */
    async obtenerDestacados(limit = 10) {
        // Obtener IDs de productos más vendidos
        const productosMasVendidos = await prisma_service_1.prisma.itemPedido.groupBy({
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
        return await prisma_service_1.prisma.producto.findMany({
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
    }
}
exports.ProductoService = ProductoService;
exports.default = new ProductoService();
//# sourceMappingURL=producto.service.js.map