"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTOS CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductosController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ProductosController {
    /**
     * GET /api/productos
     */
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const categoria = req.query.categoria;
            const search = req.query.search;
            const skip = (page - 1) * limit;
            const where = {};
            if (categoria) {
                where.categoria = categoria;
            }
            if (search) {
                where.OR = [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { subcategoria: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [productos, total] = await Promise.all([
                prisma.producto.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        imagenes: true
                    },
                    orderBy: { nombre: 'asc' }
                }),
                prisma.producto.count({ where })
            ]);
            res.json({
                success: true,
                data: productos,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page < Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Error obteniendo productos:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * GET /api/productos/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const producto = await prisma.producto.findUnique({
                where: { id },
                include: {
                    imagenes: true
                }
            });
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto no encontrado'
                });
            }
            res.json({
                success: true,
                data: producto
            });
        }
        catch (error) {
            console.error('Error obteniendo producto:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * POST /api/productos
     */
    async create(req, res) {
        try {
            const { nombre, categoria, subcategoria, precio, precioDesde, unidad, stock, codigoBarras } = req.body;
            if (!nombre || !categoria || !subcategoria || !precio) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre, categoría, subcategoría y precio son requeridos'
                });
            }
            const producto = await prisma.producto.create({
                data: {
                    nombre,
                    categoria,
                    subcategoria,
                    precio,
                    precioDesde,
                    unidad,
                    stock: stock !== undefined ? stock : true,
                    codigoBarras
                },
                include: {
                    imagenes: true
                }
            });
            res.status(201).json({
                success: true,
                data: producto
            });
        }
        catch (error) {
            console.error('Error creando producto:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * PUT /api/productos/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre, precio, precioDesde, unidad, stock, codigoBarras } = req.body;
            const producto = await prisma.producto.update({
                where: { id },
                data: {
                    ...(nombre && { nombre }),
                    ...(precio !== undefined && { precio }),
                    ...(precioDesde !== undefined && { precioDesde }),
                    ...(unidad && { unidad }),
                    ...(stock !== undefined && { stock }),
                    ...(codigoBarras && { codigoBarras })
                },
                include: {
                    imagenes: true
                }
            });
            res.json({
                success: true,
                data: producto
            });
        }
        catch (error) {
            console.error('Error actualizando producto:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * DELETE /api/productos/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.producto.delete({
                where: { id }
            });
            res.json({
                success: true,
                message: 'Producto eliminado'
            });
        }
        catch (error) {
            console.error('Error eliminando producto:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * GET /api/productos/categoria/:categoria
     */
    async getByCategoria(req, res) {
        try {
            const { categoria } = req.params;
            const productos = await prisma.producto.findMany({
                where: {
                    categoria: categoria
                },
                include: {
                    imagenes: true
                },
                orderBy: { nombre: 'asc' }
            });
            res.json({
                success: true,
                data: productos
            });
        }
        catch (error) {
            console.error('Error obteniendo productos por categoría:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.ProductosController = ProductosController;
exports.default = new ProductosController();
//# sourceMappingURL=productos.controller.js.map