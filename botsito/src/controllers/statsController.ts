/**
 * ═══════════════════════════════════════════════════════════════
 * STATS CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StatsController {
  /**
   * GET /api/stats
   */
  async getStats(req: Request, res: Response) {
    try {
      const [
        totalClientes,
        totalProductos,
        totalPedidos,
        pedidosHoy,
        totalVendido,
        productosSinStock
      ] = await Promise.all([
        prisma.cliente.count(),
        prisma.producto. count(),
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

      res. json({
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
    } catch (error: any) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500). json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new StatsController();