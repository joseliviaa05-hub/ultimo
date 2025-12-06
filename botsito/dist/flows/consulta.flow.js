"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * FLOW DE CONSULTAS - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowMediosPago = exports.flowHorarios = exports.flowMisEstadisticas = exports.flowMisPedidos = exports.flowConsultarPrecio = void 0;
const bot_1 = require("@builderbot/bot");
const producto_service_1 = __importDefault(require("../services/producto.service"));
const cliente_service_1 = __importDefault(require("../services/cliente.service"));
/**
 * Flow: Consultar precio
 */
exports.flowConsultarPrecio = (0, bot_1.addKeyword)(['precio', 'cuanto sale', 'cuanto cuesta'])
    .addAnswer('💰 *CONSULTA DE PRECIO*\n\n' +
    'Escribí el nombre del producto que querés consultar:', { capture: true }, async (ctx, { flowDynamic }) => {
    const busqueda = ctx.body.trim();
    const productos = await producto_service_1.default.buscar(busqueda);
    if (productos.length === 0) {
        await flowDynamic([
            '❌ No encontré ese producto.\n\n' +
                'Probá con otro nombre o escribí *categorias* para ver todo.'
        ]);
        return;
    }
    let mensaje = `🔍 Resultados para "${busqueda}":\n\n`;
    productos.slice(0, 5).forEach((prod) => {
        mensaje += `📦 *${prod.nombre}*\n`;
        mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
        if (prod.unidad)
            mensaje += ` ${prod.unidad}`;
        mensaje += `\n`;
        mensaje += `   📂 ${prod.categoria.replace(/_/g, ' ')}\n`;
        mensaje += `   ${prod.stock ? '✅ En stock' : '❌ Sin stock'}\n\n`;
    });
    mensaje += '¿Querés hacer un pedido?  Escribí *pedido*';
    await flowDynamic([mensaje]);
});
/**
 * Flow: Ver mis pedidos
 */
exports.flowMisPedidos = (0, bot_1.addKeyword)(['mis pedidos', 'historial', 'pedidos anteriores'])
    .addAnswer(null, null, async (ctx, { flowDynamic }) => {
    const pedidos = await cliente_service_1.default.obtenerHistorialPedidos(ctx.from, 5);
    if (pedidos.length === 0) {
        await flowDynamic([
            '📋 Todavía no tenés pedidos realizados.\n\n' +
                'Escribí *pedido* para hacer tu primera compra!  🛒'
        ]);
        return;
    }
    let mensaje = '📋 *TUS ÚLTIMOS PEDIDOS:*\n\n';
    pedidos.forEach((pedido) => {
        mensaje += `🔹 *${pedido.numero}*\n`;
        mensaje += `   📅 ${new Date(pedido.fecha).toLocaleDateString('es-AR')}\n`;
        mensaje += `   💰 $${Number(pedido.total).toLocaleString('es-AR')}\n`;
        mensaje += `   📍 ${pedido.tipoEntrega === 'DELIVERY' ? 'Delivery' : 'Retiro'}\n`;
        mensaje += `   ${pedido.estado === 'ENTREGADO' ? '✅' : '⏳'} ${pedido.estado}\n\n`;
    });
    await flowDynamic([mensaje]);
});
/**
 * Flow: Mis estadísticas
 */
exports.flowMisEstadisticas = (0, bot_1.addKeyword)(['mis datos', 'estadisticas', 'mi cuenta'])
    .addAnswer(null, null, async (ctx, { flowDynamic }) => {
    const cliente = await cliente_service_1.default.obtenerPorTelefono(ctx.from);
    const stats = await cliente_service_1.default.obtenerEstadisticas(ctx.from);
    if (!cliente) {
        await flowDynamic([
            '❌ No te encontré en nuestro sistema.\n\n' +
                'Escribí *pedido* para registrarte y hacer tu primera compra.'
        ]);
        return;
    }
    const mensaje = `👤 *TUS DATOS*\n\n` +
        `📱 Nombre: ${cliente.nombre}\n` +
        `📞 Teléfono: ${cliente.telefono}\n` +
        `📅 Cliente desde: ${new Date(cliente.fechaRegistro).toLocaleDateString('es-AR')}\n\n` +
        `📊 *ESTADÍSTICAS:*\n\n` +
        `🛒 Total de pedidos: ${stats.totalPedidos}\n` +
        `💰 Total gastado: $${stats.totalGastado.toLocaleString('es-AR')}\n` +
        `📅 Última compra: ${stats.ultimaCompra ? new Date(stats.ultimaCompra).toLocaleDateString('es-AR') : 'Nunca'}`;
    await flowDynamic([mensaje]);
});
/**
 * Flow: Horarios y ubicación
 */
exports.flowHorarios = (0, bot_1.addKeyword)(['horarios', 'horario', 'ubicacion', 'direccion', 'donde estan'])
    .addAnswer([
    '🏪 *INFORMACIÓN DEL LOCAL*\n',
    '📍 Dirección: [Tu dirección aquí]',
    '🕐 Horarios:',
    '   Lunes a Viernes: 9:00 - 19:00',
    '   Sábados: 9:00 - 13:00',
    '   Domingos: Cerrado',
    '',
    '📞 También podés hacer pedidos por este chat 24/7'
]);
/**
 * Flow: Medios de pago
 */
exports.flowMediosPago = (0, bot_1.addKeyword)(['pago', 'medios de pago', 'como pago', 'formas de pago'])
    .addAnswer([
    '💳 *MEDIOS DE PAGO*\n',
    '✅ Efectivo',
    '✅ Transferencia bancaria',
    '✅ Mercado Pago',
    '✅ Tarjetas de débito/crédito',
    '',
    '📝 ¿Querés hacer un pedido? Escribí *pedido*'
]);
//# sourceMappingURL=consulta.flow.js.map