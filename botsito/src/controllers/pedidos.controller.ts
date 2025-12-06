/**
 * ═══════════════════════════════════════════════════════════════
 * PEDIDOS CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { PrismaClient, EstadoPedido, EstadoPago, TipoEntrega } from '@prisma/client';

const prisma = new PrismaClient();

export class PedidosController {
  /**
   * GET /api/pedidos
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req. query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const estado = req.query.estado as EstadoPedido;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (estado) {
        where. estado = estado;
      }

      const [pedidos, total] = await Promise.all([
        prisma.pedido.findMany({
          where,
          skip,
          take: limit,
          include: {
            cliente: true,
            items: {
              include: {
                producto: true
              }
            }
          },
          orderBy: { fecha: 'desc' }
        }),
        prisma.pedido.count({ where })
      ]);

      res.json({
        success: true,
        data: pedidos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Error obteniendo pedidos:', error);
      res.status(500). json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/pedidos/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const pedido = await prisma.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          items: {
            include: {
              producto: true
            }
          }
        }
      });

      if (!pedido) {
        return res.status(404).json({
          success: false,
          error: 'Pedido no encontrado'
        });
      }

      res.json({
        success: true,
        data: pedido
      });
    } catch (error: any) {
      console.error('Error obteniendo pedido:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/pedidos
   */
  async create(req: Request, res: Response) {
    try {
      const { clienteId, items, tipoEntrega, estadoPago } = req.body;

      if (!clienteId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'clienteId e items son requeridos'
        });
      }

      // Generar número de pedido
      const ultimoPedido = await prisma. pedido.findFirst({
        orderBy: { fecha: 'desc' },
        select: { numero: true }
      });

      let numeroPedido = 1;
      if (ultimoPedido) {
        const match = ultimoPedido.numero. match(/PED-(\d+)/);
        if (match) {
          numeroPedido = parseInt(match[1], 10) + 1;
        }
      }
      const numero = `PED-${String(numeroPedido).padStart(3, '0')}`;

      // Calcular totales
      let subtotal = 0;
      const itemsData: any[] = [];

      for (const item of items) {
        const producto = await prisma.producto.findUnique({
          where: { id: item.productoId }
        });

        if (!producto) {
          return res.status(400).json({
            success: false,
            error: `Producto ${item.productoId} no encontrado`
          });
        }

        const itemSubtotal = Number(producto.precio) * item.cantidad;
        subtotal += itemSubtotal;

        itemsData.push({
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
          subtotal: itemSubtotal
        });
      }

      const descuento = 0;
      const delivery = tipoEntrega === 'DELIVERY' ? 500 : 0;
      const total = subtotal - descuento + delivery;

      // Obtener cliente
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
      });

      if (!cliente) {
        return res.status(400).json({
          success: false,
          error: 'Cliente no encontrado'
        });
      }

      // Crear pedido con transacción
      const pedido = await prisma.$transaction(async (tx) => {
        const nuevoPedido = await tx.pedido.create({
          data: {
            numero,
            clienteId,
            nombreCliente: cliente.nombre,
            subtotal,
            descuento,
            delivery,
            total,
            tipoEntrega: tipoEntrega as TipoEntrega || 'RETIRO',
            estadoPago: estadoPago as EstadoPago || 'PENDIENTE',
            items: {
              create: itemsData
            }
          },
          include: {
            cliente: true,
            items: {
              include: {
                producto: true
              }
            }
          }
        });

        // Actualizar estadísticas del cliente
        await tx.cliente.update({
          where: { id: clienteId },
          data: {
            totalPedidos: { increment: 1 },
            totalGastado: { increment: total }
          }
        });

        return nuevoPedido;
      });

      res.status(201).json({
        success: true,
        data: pedido
      });
    } catch (error: any) {
      console. error('Error creando pedido:', error);
      res.status(400).json({
        success: false,
        error: error. message
      });
    }
  }

  /**
   * PUT /api/pedidos/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado, estadoPago } = req.body;

      const pedido = await prisma.pedido.update({
        where: { id },
        data: {
          ...(estado && { estado: estado as EstadoPedido }),
          ...(estadoPago && { estadoPago: estadoPago as EstadoPago })
        },
        include: {
          cliente: true,
          items: {
            include: {
              producto: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: pedido
      });
    } catch (error: any) {
      console.error('Error actualizando pedido:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/pedidos/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.pedido.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Pedido eliminado'
      });
    } catch (error: any) {
      console.error('Error eliminando pedido:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new PedidosController();