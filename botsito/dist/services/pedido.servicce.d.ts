/**
 * ═══════════════════════════════════════════════════════════════
 * PEDIDO SERVICE - Gestión de pedidos
 * ═══════════════════════════════════════════════════════════════
 */
import { Pedido } from '@prisma/client';
interface ItemPedido {
    productoId: string;
    cantidad: number;
}
interface CrearPedidoData {
    clienteTelefono: string;
    items: ItemPedido[];
    tipoEntrega: 'DELIVERY' | 'RETIRO';
    descuentoPorcentaje?: number;
}
export declare class PedidoService {
    /**
     * Generar número de pedido
     */
    private generarNumeroPedido;
    /**
     * Crear un nuevo pedido
     */
    crear(data: CrearPedidoData): Promise<Pedido>;
    /**
     * Obtener pedido por número
     */
    obtenerPorNumero(numero: string): Promise<({
        cliente: {
            id: string;
            telefono: string;
            nombre: string;
            fechaRegistro: Date;
            ultimaInteraccion: Date;
            totalPedidos: number;
            totalGastado: import("@prisma/client/runtime/library").Decimal;
        };
        items: ({
            producto: {
                id: string;
                nombre: string;
                codigoBarras: string | null;
                categoria: import(".prisma/client").$Enums.Categoria;
                subcategoria: string;
                precio: import("@prisma/client/runtime/library").Decimal;
                precioDesde: import("@prisma/client/runtime/library").Decimal | null;
                unidad: string | null;
                stock: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            nombre: string;
            pedidoId: string;
            productoId: string;
            cantidad: number;
            precioUnitario: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        estado: import(".prisma/client").$Enums.EstadoPedido;
        id: string;
        numero: string;
        clienteId: string;
        nombreCliente: string;
        fecha: Date;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        descuentoPorcentaje: number | null;
        delivery: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        tipoEntrega: import(".prisma/client").$Enums.TipoEntrega;
        estadoPago: import(".prisma/client").$Enums.EstadoPago;
    }) | null>;
    /**
     * Actualizar estado del pedido
     */
    actualizarEstado(pedidoId: string, estado: string): Promise<{
        estado: import(".prisma/client").$Enums.EstadoPedido;
        id: string;
        numero: string;
        clienteId: string;
        nombreCliente: string;
        fecha: Date;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        descuentoPorcentaje: number | null;
        delivery: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        tipoEntrega: import(".prisma/client").$Enums.TipoEntrega;
        estadoPago: import(".prisma/client").$Enums.EstadoPago;
    }>;
    /**
     * Actualizar estado de pago
     */
    actualizarEstadoPago(pedidoId: string, estadoPago: string): Promise<{
        estado: import(".prisma/client").$Enums.EstadoPedido;
        id: string;
        numero: string;
        clienteId: string;
        nombreCliente: string;
        fecha: Date;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        descuentoPorcentaje: number | null;
        delivery: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        tipoEntrega: import(".prisma/client").$Enums.TipoEntrega;
        estadoPago: import(".prisma/client").$Enums.EstadoPago;
    }>;
    /**
     * Obtener resumen del pedido (para WhatsApp)
     */
    obtenerResumen(pedidoId: string): Promise<string>;
}
declare const _default: PedidoService;
export default _default;
//# sourceMappingURL=pedido.servicce.d.ts.map