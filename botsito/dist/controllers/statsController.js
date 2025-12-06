"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * STATS CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class StatsController {
    /**
     * GET /api/stats
     */
    async getStats(req, res) {
        try {
            const [totalClientes, totalProductos, totalPedidos, pedidosHoy, totalVendido, productosSinStock] = await Promise.all([
                prisma.cliente.count(),
                prisma.producto.count(),
                prisma.pedido.count(),
                prisma.pedido.count({
                    where: {
                        fecha: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                }),
                prisma.pedido.aggregate({
                    _sum: {
                        total: true
                    }
                }),
                prisma.producto.count({
                    where: { stock: false }
                })
            ]);
            res.json({
                success: true,
                data: {
                    clientes: {
                        total: totalClientes
                    },
                    productos: {
                        total: totalProductos,
                        sinStock: productosSinStock
                    },
                    pedidos: {
                        total: totalPedidos,
                        hoy: pedidosHoy,
                        totalVendido: Number(totalVendido._sum.total || 0)
                    }
                }
            });
        }
        catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.StatsController = StatsController;
exports.default = new StatsController();
//# sourceMappingURL=statsController.js.map