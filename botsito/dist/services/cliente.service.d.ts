/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENTE SERVICE - Gestión de clientes
 * ═══════════════════════════════════════════════════════════════
 */
import { Cliente } from '@prisma/client';
export declare class ClienteService {
    /**
     * Obtener o crear cliente por teléfono
     */
    obtenerOCrear(telefono: string, nombre?: string): Promise<Cliente>;
    /**
     * Actualizar nombre del cliente
     */
    actualizarNombre(telefono: string, nombre: string): Promise<Cliente>;
    /**
     * Obtener cliente por teléfono
     */
    obtenerPorTelefono(telefono: string): Promise<Cliente | null>;
    /**
     * Obtener historial de pedidos del cliente
     */
    obtenerHistorialPedidos(telefono: string, limit?: number): Promise<({
        items: ({
            producto: {
                id: string;
                nombre: string;
                categoria: import(".prisma/client").$Enums.Categoria;
                subcategoria: string;
                precio: import("@prisma/client/runtime/library").Decimal;
                precioDesde: import("@prisma/client/runtime/library").Decimal | null;
                unidad: string | null;
                stock: boolean;
                codigoBarras: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            nombre: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            pedidoId: string;
            productoId: string;
            cantidad: number;
            precioUnitario: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
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
        estado: import(".prisma/client").$Enums.EstadoPedido;
        estadoPago: import(".prisma/client").$Enums.EstadoPago;
    })[]>;
    /**
     * Obtener estadísticas del cliente
     */
    obtenerEstadisticas(telefono: string): Promise<{
        totalPedidos: number;
        totalGastado: number;
        ultimaCompra: Date | null;
    }>;
}
declare const _default: ClienteService;
export default _default;
//# sourceMappingURL=cliente.service.d.ts.map