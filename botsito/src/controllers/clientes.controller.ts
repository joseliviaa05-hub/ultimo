/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENTES CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClientesController {
  /**
   * GET /api/clientes
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req. query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          skip,
          take: limit,
          orderBy: { ultimaInteraccion: 'desc' },
          include: {
            _count: {
              select: { pedidos: true }
            }
          }
        }),
        prisma.cliente. count()
      ]);

      res.json({
        success: true,
        data: clientes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Error obteniendo clientes:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/clientes/:telefono
   */
  async getByTelefono(req: Request, res: Response) {
    try {
      const { telefono } = req.params;

      const cliente = await prisma. cliente.findUnique({
        where: { telefono },
        include: {
          pedidos: {
            orderBy: { fecha: 'desc' },
            take: 10,
            include: {
              items: true
            }
          }
        }
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
      }

      res. json({
        success: true,
        data: cliente
      });
    } catch (error: any) {
      console.error('Error obteniendo cliente:', error);
      res.status(500). json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/clientes
   */
  async create(req: Request, res: Response) {
    try {
      const { telefono, nombre } = req.body;

      if (!telefono || !nombre) {
        return res.status(400).json({
          success: false,
          error: 'Teléfono y nombre son requeridos'
        });
      }

      const cliente = await prisma.cliente.create({
        data: {
          telefono,
          nombre
        }
      });

      res.status(201).json({
        success: true,
        data: cliente
      });
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/clientes/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, telefono } = req.body;

      const cliente = await prisma.cliente. update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(telefono && { telefono })
        }
      });

      res.json({
        success: true,
        data: cliente
      });
    } catch (error: any) {
      console.error('Error actualizando cliente:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/clientes/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.cliente.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Cliente eliminado'
      });
    } catch (error: any) {
      console.error('Error eliminando cliente:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new ClientesController();