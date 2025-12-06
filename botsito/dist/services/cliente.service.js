"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENTE SERVICE - Gestión de clientes
 * ═══════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteService = void 0;
const prisma_service_1 = require("./prisma.service");
class ClienteService {
    /**
     * Obtener o crear cliente por teléfono
     */
    async obtenerOCrear(telefono, nombre) {
        // Limpiar teléfono
        const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
        // Buscar cliente existente
        let cliente = await prisma_service_1.prisma.cliente.findUnique({
            where: { telefono: telefonoLimpio },
        });
        // Si no existe, crear uno nuevo
        if (!cliente) {
            cliente = await prisma_service_1.prisma.cliente.create({
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
    async actualizarNombre(telefono, nombre) {
        const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
        return await prisma_service_1.prisma.cliente.update({
            where: { telefono: telefonoLimpio },
            data: { nombre },
        });
    }
    /**
     * Obtener cliente por teléfono
     */
    async obtenerPorTelefono(telefono) {
        const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
        return await prisma_service_1.prisma.cliente.findUnique({
            where: { telefono: telefonoLimpio },
            include: {
                _count: {
                    select: { pedidos: true },
                },
            },
        });
    }
    /**
     * Obtener historial de pedidos del cliente
     */
    async obtenerHistorialPedidos(telefono, limit = 5) {
        const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
        const cliente = await prisma_service_1.prisma.cliente.findUnique({
            where: { telefono: telefonoLimpio },
        });
        if (!cliente)
            return [];
        return await prisma_service_1.prisma.pedido.findMany({
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
    async obtenerEstadisticas(telefono) {
        const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
        const cliente = await prisma_service_1.prisma.cliente.findUnique({
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
        const ultimoPedido = await prisma_service_1.prisma.pedido.findFirst({
            where: { clienteId: cliente.id },
            orderBy: { fecha: 'desc' },
        });
        return {
            totalPedidos: cliente.totalPedidos,
            totalGastado: Number(cliente.totalGastado),
            ultimaCompra: ultimoPedido?.fecha || null,
        };
    }
}
exports.ClienteService = ClienteService;
exports.default = new ClienteService();
//# sourceMappingURL=cliente.service.js.map