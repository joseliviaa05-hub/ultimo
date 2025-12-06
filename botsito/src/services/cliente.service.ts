/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENTE SERVICE - Gestión de clientes
 * ═══════════════════════════════════════════════════════════════
 */

import { prisma } from './prisma.service';
import { Cliente } from '@prisma/client';

export class ClienteService {
  /**
   * Obtener o crear cliente por teléfono
   */
  async obtenerOCrear(telefono: string, nombre?: string): Promise<Cliente> {
    // Limpiar teléfono
    const telefonoLimpio = telefono.replace(/[^0-9]/g, '');

    // Buscar cliente existente
    let cliente = await prisma.cliente. findUnique({
      where: { telefono: telefonoLimpio },
    });

    // Si no existe, crear uno nuevo
    if (!cliente) {
      cliente = await prisma. cliente.create({
        data: {
          telefono: telefonoLimpio,
          nombre: nombre || 'Cliente WhatsApp',
        },
      });
    }

    return cliente;
  }

  /**
   * Actualizar nombre del cliente
   */
  async actualizarNombre(telefono: string, nombre: string): Promise<Cliente> {
    const telefonoLimpio = telefono. replace(/[^0-9]/g, '');

    return await prisma.cliente.update({
      where: { telefono: telefonoLimpio },
      data: { nombre },
    });
  }

  /**
   * Obtener cliente por teléfono
   */
  async obtenerPorTelefono(telefono: string): Promise<Cliente | null> {
    const telefonoLimpio = telefono.replace(/[^0-9]/g, '');

    return await prisma.cliente.findUnique({
      where: { telefono: telefonoLimpio },
      include: {
        _count: {
          select: { pedidos: true },
        },
      },
    });
  }

  /**
   * Obtener lista paginada de clientes
   */
  async obtenerTodos(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: { pedidos: true },
          },
        },
        orderBy: {
          fechaRegistro: 'desc', // ✅ CAMBIO AQUÍ
        },
      }),
      prisma.cliente. count(),
    ]);

    return {
      data: clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Buscar clientes por nombre o teléfono
   */
  async buscar(query: string) {
    const searchTerm = query.toLowerCase();

    return await prisma.cliente. findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            telefono: {
              contains: searchTerm,
            },
          },
        ],
      },
      include: {
        _count: {
          select: { pedidos: true },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  /**
   * Obtener historial de pedidos del cliente
   */
  async obtenerHistorialPedidos(telefono: string, limit: number = 5) {
    const telefonoLimpio = telefono.replace(/[^0-9]/g, '');

    const cliente = await prisma.cliente.findUnique({
      where: { telefono: telefonoLimpio },
    });

    if (!cliente) return [];

    return await prisma. pedido.findMany({
      where: { clienteId: cliente.id },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtener estadísticas del cliente
   */
  async obtenerEstadisticas(telefono: string) {
    const telefonoLimpio = telefono.replace(/[^0-9]/g, '');

    const cliente = await prisma.cliente. findUnique({
      where: { telefono: telefonoLimpio },
      include: {
        _count: {
          select: { pedidos: true },
        },
      },
    });

    if (!cliente) {
      return {
        totalPedidos: 0,
        totalGastado: 0,
        ultimaCompra: null,
      };
    }

    const ultimoPedido = await prisma.pedido.findFirst({
      where: { clienteId: cliente.id },
      orderBy: { fecha: 'desc' },
    });

    return {
      totalPedidos: cliente. totalPedidos,
      totalGastado: Number(cliente. totalGastado),
      ultimaCompra: ultimoPedido?. fecha || null,
    };
  }
}

export default new ClienteService();