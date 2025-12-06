"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * FLOW DE PEDIDOS - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowPedido = exports.flowCancelarPedido = exports.flowConfirmarPedido = exports.flowVerCarrito = exports.flowAgregarProducto = exports.flowProductosDestacados = exports.flowBuscarProducto = exports.flowSeleccionarCategoria = exports.flowInicioPedido = void 0;
const bot_1 = require("@builderbot/bot");
const cliente_service_1 = __importDefault(require("../services/cliente.service"));
const producto_service_1 = __importDefault(require("../services/producto.service"));
const pedido_service_1 = __importDefault(require("../services/pedido.service"));
// Estado temporal del pedido (en memoria)
const pedidosTemporales = new Map();
/**
 * Flow: Iniciar nuevo pedido
 */
exports.flowInicioPedido = (0, bot_1.addKeyword)(bot_1.EVENTS.ACTION)
    .addAnswer('🛒 *NUEVO PEDIDO*\n\n' +
    'Perfecto, vamos a armar tu pedido.\n\n' +
    '📝 ¿Cómo te llamás?', { capture: true }, async (ctx, { flowDynamic, state }) => {
    const nombre = ctx.body.trim();
    // Guardar o actualizar cliente
    await cliente_service_1.default.obtenerOCrear(ctx.from, nombre);
    await cliente_service_1.default.actualizarNombre(ctx.from, nombre);
    await state.update({ nombreCliente: nombre });
    await flowDynamic([
        `Perfecto ${nombre}! 👍\n\n` +
            '🛍️ *¿Qué querés pedir?*\n\n' +
            'Podés:\n' +
            '1️⃣ Ver categorías\n' +
            '2️⃣ Buscar un producto\n' +
            '3️⃣ Ver productos destacados'
    ]);
});
/**
 * Flow: Seleccionar categoría
 */
exports.flowSeleccionarCategoria = (0, bot_1.addKeyword)(['1', 'categorias', 'ver categorias'])
    .addAnswer('📂 *CATEGORÍAS DISPONIBLES*', null, async (ctx, { flowDynamic }) => {
    const categorias = await producto_service_1.default.obtenerCategorias();
    let mensaje = 'Seleccioná una categoría:\n\n';
    categorias.forEach((cat, index) => {
        mensaje += `${index + 1}️⃣ ${cat.replace(/_/g, ' ')}\n`;
    });
    await flowDynamic([mensaje]);
});
/**
 * Flow: Buscar producto
 */
exports.flowBuscarProducto = (0, bot_1.addKeyword)(['2', 'buscar', 'buscar producto'])
    .addAnswer('🔍 *BUSCAR PRODUCTO*\n\n' +
    'Escribí el nombre o parte del producto que buscás:', { capture: true }, async (ctx, { flowDynamic }) => {
    const busqueda = ctx.body.trim();
    const productos = await producto_service_1.default.buscar(busqueda);
    if (productos.length === 0) {
        await flowDynamic([
            '❌ No encontré productos con ese nombre.\n\n' +
                'Probá con otro término o escribí "categorias" para ver todas las categorías.'
        ]);
        return;
    }
    let mensaje = `🎯 *Encontré ${productos.length} productos:*\n\n`;
    productos.forEach((prod, index) => {
        mensaje += `${index + 1}.  *${prod.nombre}*\n`;
        mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
        if (prod.unidad)
            mensaje += ` ${prod.unidad}`;
        mensaje += `\n`;
        // Enviar imagen si existe
        if (prod.imagenes && prod.imagenes.length > 0) {
            // Nota: Aquí podrías enviar la imagen
            mensaje += `   📸 [Imagen disponible]\n`;
        }
        mensaje += `\n`;
    });
    mensaje += '\n📝 Para agregar un producto escribí:\n';
    mensaje += '*agregar [número] [cantidad]*\n';
    mensaje += 'Ejemplo: agregar 1 2';
    await flowDynamic([mensaje]);
    // Guardar productos en contexto temporal
    pedidosTemporales.set(ctx.from, {
        ...pedidosTemporales.get(ctx.from),
        productosDisponibles: productos
    });
});
/**
 * Flow: Productos destacados
 */
exports.flowProductosDestacados = (0, bot_1.addKeyword)(['3', 'destacados', 'mas vendidos'])
    .addAnswer('⭐ *PRODUCTOS MÁS VENDIDOS*', null, async (ctx, { flowDynamic }) => {
    const productos = await producto_service_1.default.obtenerDestacados(5);
    let mensaje = '🔥 Los productos más pedidos:\n\n';
    productos.forEach((prod, index) => {
        mensaje += `${index + 1}.  *${prod.nombre}*\n`;
        mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
        if (prod.unidad)
            mensaje += ` ${prod.unidad}`;
        mensaje += `\n\n`;
    });
    mensaje += '📝 Para agregar escribí:\n';
    mensaje += '*agregar [número] [cantidad]*';
    await flowDynamic([mensaje]);
    pedidosTemporales.set(ctx.from, {
        ...pedidosTemporales.get(ctx.from),
        productosDisponibles: productos
    });
});
/**
 * Flow: Agregar producto al carrito
 */
exports.flowAgregarProducto = (0, bot_1.addKeyword)(['agregar'])
    .addAnswer(null, null, async (ctx, { flowDynamic }) => {
    const partes = ctx.body.split(' ');
    if (partes.length < 3) {
        await flowDynamic([
            '❌ Formato incorrecto.\n\n' +
                'Usá: *agregar [número] [cantidad]*\n' +
                'Ejemplo: agregar 1 2'
        ]);
        return;
    }
    const numeroProducto = parseInt(partes[1]) - 1;
    const cantidad = parseInt(partes[2]);
    const pedidoTemp = pedidosTemporales.get(ctx.from);
    if (!pedidoTemp || !pedidoTemp.productosDisponibles) {
        await flowDynamic([
            '❌ Primero buscá productos o seleccioná una categoría.'
        ]);
        return;
    }
    const producto = pedidoTemp.productosDisponibles[numeroProducto];
    if (!producto) {
        await flowDynamic(['❌ Número de producto inválido.']);
        return;
    }
    // Agregar al carrito temporal
    const carrito = pedidoTemp.carrito || [];
    carrito.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        cantidad
    });
    pedidosTemporales.set(ctx.from, {
        ...pedidoTemp,
        carrito
    });
    const subtotal = Number(producto.precio) * cantidad;
    await flowDynamic([
        `✅ Agregado al carrito:\n\n` +
            `📦 ${producto.nombre} x${cantidad}\n` +
            `💰 $${subtotal.toLocaleString('es-AR')}\n\n` +
            `Podés:\n` +
            `➕ Seguir agregando productos\n` +
            `✅ Escribir *confirmar* para finalizar\n` +
            `🗑️ Escribir *cancelar* para vaciar carrito`
    ]);
});
/**
 * Flow: Ver carrito
 */
exports.flowVerCarrito = (0, bot_1.addKeyword)(['carrito', 'ver carrito'])
    .addAnswer(null, null, async (ctx, { flowDynamic }) => {
    const pedidoTemp = pedidosTemporales.get(ctx.from);
    if (!pedidoTemp || !pedidoTemp.carrito || pedidoTemp.carrito.length === 0) {
        await flowDynamic(['🛒 Tu carrito está vacío.']);
        return;
    }
    let mensaje = '🛒 *TU CARRITO:*\n\n';
    let total = 0;
    pedidoTemp.carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `${index + 1}.  ${item.nombre} x${item.cantidad}\n`;
        mensaje += `   $${subtotal.toLocaleString('es-AR')}\n\n`;
    });
    mensaje += `💰 *TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
    mensaje += `✅ *confirmar* para finalizar\n`;
    mensaje += `🗑️ *cancelar* para vaciar`;
    await flowDynamic([mensaje]);
});
/**
 * Flow: Confirmar pedido
 */
exports.flowConfirmarPedido = (0, bot_1.addKeyword)(['confirmar', 'confirmar pedido'])
    .addAnswer('📍 *TIPO DE ENTREGA*\n\n' +
    '1️⃣ 🚚 Delivery (+$500)\n' +
    '2️⃣ 🏪 Retiro en local (Gratis)\n\n' +
    'Escribí 1 o 2:', { capture: true }, async (ctx, { flowDynamic, state }) => {
    const opcion = ctx.body.trim();
    const tipoEntrega = opcion === '1' ? 'DELIVERY' : 'RETIRO';
    await state.update({ tipoEntrega });
    const pedidoTemp = pedidosTemporales.get(ctx.from);
    if (!pedidoTemp || !pedidoTemp.carrito || pedidoTemp.carrito.length === 0) {
        await flowDynamic(['❌ Tu carrito está vacío.']);
        return;
    }
    try {
        // Crear pedido en la base de datos
        const items = pedidoTemp.carrito.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad
        }));
        const pedido = await pedido_service_1.default.crear({
            clienteTelefono: ctx.from,
            items,
            tipoEntrega: tipoEntrega,
        });
        // Obtener resumen
        const resumen = await pedido_service_1.default.obtenerResumen(pedido.id);
        // Limpiar carrito temporal
        pedidosTemporales.delete(ctx.from);
        await flowDynamic([
            '✅ *PEDIDO CONFIRMADO*\n\n' +
                resumen +
                '\n\n' +
                '📞 Te contactaremos para coordinar la entrega.\n' +
                '¡Gracias por tu compra!  🎉'
        ]);
    }
    catch (error) {
        await flowDynamic([
            '❌ Error al crear el pedido:\n' +
                error.message +
                '\n\nIntentá nuevamente o contactanos.'
        ]);
    }
});
/**
 * Flow: Cancelar pedido
 */
exports.flowCancelarPedido = (0, bot_1.addKeyword)(['cancelar', 'vaciar', 'limpiar'])
    .addAnswer(null, null, async (ctx, { flowDynamic }) => {
    pedidosTemporales.delete(ctx.from);
    await flowDynamic([
        '🗑️ Carrito vaciado.\n\n' +
            'Escribí *pedido* para empezar uno nuevo.'
    ]);
});
// Exportar flow principal de pedidos
exports.flowPedido = (0, bot_1.addKeyword)(['pedido', 'pedir', 'comprar', 'hacer pedido'])
    .addAction(exports.flowInicioPedido);
//# sourceMappingURL=pedido.flow.js.map