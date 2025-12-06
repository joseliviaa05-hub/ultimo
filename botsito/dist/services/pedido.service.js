"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * PEDIDO SERVICE - Gestión de pedidos
 * ═══════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidoService = void 0;
const prisma_service_1 = require("./prisma.service");
class PedidoService {
    /**
     * Generar número de pedido
     */
    async generarNumeroPedido() {
        const ultimoPedido = await prisma_service_1.prisma.pedido.findFirst({
            orderBy: { fecha: 'desc' },
            select: { numero: true },
        });
        let numeroPedido = 1;
        if (ultimoPedido) {
            const match = ultimoPedido.numero.match(/PED-(\d+)/);
            if (match) {
                numeroPedido = parseInt(match[1], 10) + 1;
            }
        }
        return `PED-${String(numeroPedido).padStart(4, '0')}`;
    }
    /**
     * Crear un nuevo pedido
     */
    async crear(data) {
        // 1. Obtener o crear cliente
        const telefonoLimpio = data.clienteTelefono.replace(/[^0-9]/g, '');
        let cliente = await prisma_service_1.prisma.cliente.findUnique({
            where: { telefono: telefonoLimpio },
        });
        if (!cliente) {
            cliente = await prisma_service_1.prisma.cliente.create({
                data: {
                    telefono: telefonoLimpio,
                    nombre: 'Cliente WhatsApp',
                },
            });
        }
        // 2. Generar número de pedido
        const numero = await this.generarNumeroPedido();
        // 3. Calcular items y totales
        let subtotal = 0;
        const itemsData = [];
        for (const item of data.items) {
            const producto = await prisma_service_1.prisma.producto.findUnique({
                where: { id: item.productoId },
            });
            if (!producto) {
                throw new Error(`Producto ${item.productoId} no encontrado`);
            }
            if (!producto.stock) {
                throw new Error(`Producto ${producto.nombre} sin stock`);
            }
            const itemSubtotal = Number(producto.precio) * item.cantidad;
            subtotal += itemSubtotal;
            itemsData.push({
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: item.cantidad,
                precioUnitario: producto.precio,
                subtotal: itemSubtotal,
            });
        }
        // 4. Calcular descuento y delivery
        const descuentoPorcentaje = data.descuentoPorcentaje || 0;
        const descuento = (subtotal * descuentoPorcentaje) / 100;
        const delivery = data.tipoEntrega === 'DELIVERY' ? 500 : 0;
        const total = subtotal - descuento + delivery;
        // 5. Crear pedido con transacción
        const pedido = await prisma_service_1.prisma.$transaction(async (tx) => {
            const nuevoPedido = await tx.pedido.create({
                data: {
                    numero,
                    clienteId: cliente.id,
                    nombreCliente: cliente.nombre,
                    subtotal,
                    descuento,
                    descuentoPorcentaje,
                    delivery,
                    total,
                    tipoEntrega: data.tipoEntrega,
                    estadoPago: 'PENDIENTE',
                    items: {
                        create: itemsData,
                    },
                },
                include: {
                    cliente: true,
                    items: {
                        include: {
                            producto: true,
                        },
                    },
                },
            });
            // Actualizar estadísticas del cliente
            await tx.cliente.update({
                where: { id: cliente.id },
                data: {
                    totalPedidos: { increment: 1 },
                    totalGastado: { increment: total },
                },
            });
            return nuevoPedido;
        });
        return pedido;
    }
    /**
     * Obtener pedido por número
     */
    async obtenerPorNumero(numero) {
        return await prisma_service_1.prisma.pedido.findUnique({
            where: { numero },
            include: {
                cliente: true,
                items: {
                    include: {
                        producto: true,
                    },
                },
            },
        });
    }
    /**
     * Actualizar estado del pedido
     */
    async actualizarEstado(pedidoId, estado) {
        return await prisma_service_1.prisma.pedido.update({
            where: { id: pedidoId },
            data: { estado: estado },
        });
    }
    /**
     * Actualizar estado de pago
     */
    async actualizarEstadoPago(pedidoId, estadoPago) {
        return await prisma_service_1.prisma.pedido.update({
            where: { id: pedidoId },
            data: { estadoPago: estadoPago },
        });
    }
    /**
     * Obtener resumen del pedido (para WhatsApp)
     */
    async obtenerResumen(pedidoId) {
        const pedido = await prisma_service_1.prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: {
                items: {
                    include: {
                        producto: true,
                    },
                },
            },
        });
        if (!pedido)
            return 'Pedido no encontrado';
        let resumen = `📋 *PEDIDO ${pedido.numero}*\n\n`;
        resumen += `👤 Cliente: ${pedido.nombreCliente}\n`;
        resumen += `📅 Fecha: ${pedido.fecha.toLocaleDateString('es-AR')}\n\n`;
        resumen += `🛒 *Productos:*\n`;
        pedido.items.forEach((item) => {
            resumen += `  • ${item.nombre} x${item.cantidad} - $${Number(item.subtotal).toLocaleString('es-AR')}\n`;
        });
        resumen += `\n💰 *Totales:*\n`;
        resumen += `  Subtotal: $${Number(pedido.subtotal).toLocaleString('es-AR')}\n`;
        if (Number(pedido.descuento) > 0) {
            resumen += `  Descuento: -$${Number(pedido.descuento).toLocaleString('es-AR')}\n`;
        }
        if (Number(pedido.delivery) > 0) {
            resumen += `  Delivery: $${Number(pedido.delivery).toLocaleString('es-AR')}\n`;
        }
        resumen += `  *TOTAL: $${Number(pedido.total).toLocaleString('es-AR')}*\n\n`;
        resumen += `📍 Entrega: ${pedido.tipoEntrega === 'DELIVERY' ? '🚚 Delivery' : '🏪 Retiro en local'}\n`;
        resumen += `💳 Estado: ${pedido.estadoPago === 'PENDIENTE' ? '⏳ Pendiente' : '✅ Pagado'}`;
        return resumen;
    }
}
exports.PedidoService = PedidoService;
exports.default = new PedidoService();
//# sourceMappingURL=pedido.service.js.map