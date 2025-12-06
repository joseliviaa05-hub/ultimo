// src/controllers/handlers/orderHandler.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 📦 ORDER HANDLER - Confirmación y creación de pedidos
 * ═══════════════════════════════════════════════════════════════
 */

const sessionManager = require('../../utils/sessionManager');
const cache = require('../../utils/CacheManager');
const orderService = require('../../services/orderService');
const simpleNotificationService = require('../../services/SimpleNotificationService'); // ✅ NUEVO
const logger = require('../../middlewares/logger');

class OrderHandler {
    /**
     * Confirma el pedido y solicita método de entrega
     */
    async confirmarPedido(from, nombreContacto) {
        const carrito = sessionManager.obtenerCarrito(from);
        
        if (!carrito.productos || carrito.productos.length === 0) {
            return `❌ No tienes productos en el carrito.\n\n` +
                   `Para hacer un pedido, escribe por ejemplo:\n` +
                   `"Quiero 2 cuadernos"`;
        }
        
        const productos = carrito.productos;
        let subtotal = 0;
        
        productos.forEach(prod => {
            subtotal += prod.precio * prod.cantidad;
        });
        
        const { descuento, porcentaje } = orderService.calcularDescuento(subtotal);
        const totalFinal = subtotal - descuento;
        
        let respuesta = `📋 *RESUMEN DE TU PEDIDO*\n`;
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        productos.forEach((prod, index) => {
            const numero = index + 1;
            const subtotalProd = prod.precio * prod.cantidad;
            respuesta += `${numero}. ${prod.nombreFormateado} x${prod.cantidad}\n`;
            respuesta += `   $${subtotalProd}\n\n`;
        });
        
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n`;
        respuesta += `💰 Subtotal: $${subtotal}\n`;
        
        if (descuento > 0) {
            respuesta += `🎁 Descuento (${porcentaje}%): -$${descuento}\n`;
        }
        
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n`;
        respuesta += `💰 *TOTAL: $${totalFinal}*\n\n`;
        
        const configPedidos = cache.obtenerConfigPedidosSync();
        const negocio = cache.obtenerNegocioSync();
        
        if (configPedidos.delivery?.habilitado) {
            respuesta += `🚚 *¿Cómo lo querés recibir?*\n\n`;
            respuesta += `1️⃣ *Retiro en local* (Gratis)\n`;
            respuesta += `   📍 ${negocio.direccion}\n`;
            respuesta += `   🕐 ${negocio.horarios}\n\n`;
            
            if (configPedidos.delivery.gratis_desde && totalFinal >= configPedidos.delivery.gratis_desde) {
                respuesta += `2️⃣ *Delivery* (GRATIS por tu compra)\n\n`;
            } else {
                respuesta += `2️⃣ *Delivery* (+$${configPedidos.delivery.costo})\n\n`;
            }
            
            respuesta += `Responde *"1"* o *"2"* para continuar`;
            
            // ✅ Guardar estado
            carrito.esperando_tipo_entrega = true;
            carrito.totalFinal = totalFinal;
            carrito.descuento = descuento;
            sessionManager.actualizarCarrito(from, carrito);
            sessionManager.marcarSesionActiva(from, 'confirmando_pedido');
            
        } else {
            // Sin delivery, confirmar directamente
            respuesta += `📍 *Retiro en local*\n`;
            respuesta += `${negocio.direccion}\n`;
            respuesta += `🕐 ${negocio.horarios}\n\n`;
            
            respuesta += `💳 *Medios de pago:*\n`;
            respuesta += `${negocio.medios_pago}\n\n`;
            
            const pedido = await orderService.crear(
                { telefono: from, nombre: nombreContacto },
                productos,
                'retiro'
            );
            
            logger.info(`✅ Pedido confirmado: ${pedido.id}`);
            
            // ✅ NUEVO: Notificar con servicio simple
            try {
                await simpleNotificationService.notificar(pedido, nombreContacto, from, null);
            } catch (error) {
                logger.error('❌ Error enviando notificación:', error);
            }
            
            respuesta += `✅ *PEDIDO CONFIRMADO*\n`;
            respuesta += `📄 Número de pedido: *#${pedido.id}*\n\n`;
            respuesta += `🙏 ¡Gracias por tu compra!`;
            
            sessionManager.eliminarCarrito(from);
            sessionManager.limpiarSesion(from);
        }
        
        return respuesta;
    }

    /**
     * Procesa la opción de entrega seleccionada
     */
    async procesarOpcionEntrega(from, opcion, nombreContacto, sock) {
        const carrito = sessionManager.obtenerCarrito(from);
        
        // ✅ Verificar esperando_tipo_entrega
        if (!carrito.esperando_tipo_entrega) {
            logger.warn('⚠️ procesarOpcionEntrega: esperando_tipo_entrega NO está activo');
            return null;
        }
        
        const productos = carrito.productos;
        const totalFinal = carrito.totalFinal;
        const descuento = carrito.descuento;
        const subtotal = totalFinal + descuento;
        
        let tipoEntrega = '';
        let costoDelivery = 0;
        let respuesta = '';
        
        const negocio = cache.obtenerNegocioSync();
        
        if (opcion === '1') {
            tipoEntrega = 'retiro';
            
            respuesta += `✅ *PEDIDO CONFIRMADO*\n`;
            respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            respuesta += `🏪 *Retiro en local*\n`;
            respuesta += `📍 ${negocio.direccion}\n`;
            respuesta += `🕐 ${negocio.horarios}\n\n`;
            
        } else if (opcion === '2') {
            tipoEntrega = 'delivery';
            
            costoDelivery = orderService.calcularDelivery(totalFinal);
            
            respuesta += `✅ *PEDIDO CONFIRMADO*\n`;
            respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            respuesta += `🚚 *Delivery*\n`;
            
            if (costoDelivery > 0) {
                respuesta += `Costo de envío: $${costoDelivery}\n`;
            } else {
                respuesta += `🎉 Envío GRATIS por tu compra\n`;
            }
            respuesta += `\n`;
            
        } else {
            return `❌ Opción no válida.\n\nResponde *"1"* para retiro o *"2"* para delivery`;
        }
        
        // Mostrar resumen
        productos.forEach((prod, index) => {
            const numero = index + 1;
            respuesta += `${numero}. ${prod.nombreFormateado} x${prod.cantidad} - $${prod.precio * prod.cantidad}\n`;
        });
        
        respuesta += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        respuesta += `💰 Subtotal: $${subtotal}\n`;
        
        if (descuento > 0) {
            respuesta += `🎁 Descuento: -$${descuento}\n`;
        }
        
        if (costoDelivery > 0) {
            respuesta += `🚚 Delivery: +$${costoDelivery}\n`;
        }
        
        const totalConDelivery = totalFinal + costoDelivery;
        
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n`;
        respuesta += `💰 *TOTAL: $${totalConDelivery}*\n\n`;
        
        respuesta += `💳 *Medios de pago:*\n`;
        respuesta += `${negocio.medios_pago}\n\n`;
        
        // Crear pedido
        const pedido = await orderService.crear(
            { telefono: from, nombre: nombreContacto },
            productos,
            tipoEntrega
        );
        
        logger.info(`✅ Pedido creado: ${pedido.id} - Tipo: ${tipoEntrega}`);
        
        // ✅ NUEVO: Notificar con servicio simple
        try {
            await simpleNotificationService.notificar(pedido, nombreContacto, from, sock);
            logger.info('✅ Notificación procesada');
        } catch (error) {
            logger.error('❌ Error enviando notificación:', error);
        }
        
        respuesta += `📄 Número de pedido: *#${pedido.id}*\n\n`;
        respuesta += `🙏 ¡Gracias por tu compra!\n`;
        respuesta += `Te contactaremos pronto para coordinar.`;
        
        sessionManager.eliminarCarrito(from);
        
        return respuesta;
    }
}

module.exports = new OrderHandler();