// src/controllers/handlers/commandHandler.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🎮 COMMAND HANDLER - Comandos generales del bot
 * ═══════════════════════════════════════════════════════════════
 */

const cache = require('../../utils/CacheManager');
const clientService = require('../../services/clientService');
const productService = require('../../services/productService');
const sessionManager = require('../../utils/sessionManager');
const { formatearFecha } = require('../../utils/textHelpers');

class CommandHandler {
    /**
     * Genera mensaje de saludo personalizado
     */
    generarSaludo(from, nombreContacto) {
        const negocio = cache.obtenerNegocioSync();
        const infoCliente = clientService.obtenerPorTelefono(from);
        
        let saludo = `¡Hola`;
        
        if (infoCliente && infoCliente.total_pedidos > 0) {
            saludo += ` de nuevo`;
        }
        
        saludo += `! 👋 Bienvenido a *${negocio.nombre}*\n\n`;
        
        if (infoCliente && infoCliente.total_pedidos > 0) {
            saludo += `📊 Has realizado ${infoCliente.total_pedidos} pedido(s) con nosotros 🎉\n\n`;
        }
        
        saludo += `Te puedo ayudar con:\n` +
               `📋 Lista de precios\n` +
               `🕐 Horarios\n` +
               `📍 Ubicación\n` +
               `📦 Stock de productos\n` +
               `🛒 Hacer un pedido\n` +
               `💳 Medios de pago\n`;
        
        if (infoCliente && infoCliente.total_pedidos > 0) {
            saludo += `📜 Ver mis pedidos anteriores\n`;
        }
        
        saludo += `\n¿Qué necesitas?`;
        
        sessionManager.marcarSesionActiva(from, 'consulta');
        return saludo;
    }

    /**
     * Muestra el historial de pedidos del cliente
     */
    mostrarHistorial(telefono) {
        const infoCliente = clientService.obtenerPorTelefono(telefono);
        
        if (!infoCliente || infoCliente.total_pedidos === 0) {
            return `📜 *Tu Historial*\n\n` +
                   `Aún no has realizado pedidos con nosotros.\n\n` +
                   `¿Te gustaría hacer tu primer pedido? 🛒\n` +
                   `Escribe por ejemplo: "Quiero 2 cuadernos"`;
        }
        
        let respuesta = `📜 *TU HISTORIAL DE PEDIDOS*\n`;
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `👤 Cliente: ${infoCliente.nombre}\n`;
        respuesta += `📱 Teléfono: ${infoCliente.telefono.replace('@c.us', '')}\n`;
        respuesta += `📅 Cliente desde: ${formatearFecha(infoCliente.fecha_registro)}\n`;
        respuesta += `📦 Total de pedidos: ${infoCliente.total_pedidos}\n`;
        respuesta += `💰 Total gastado: $${infoCliente.total_gastado}\n\n`;
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        if (infoCliente.pedidos.length > 0) {
            respuesta += `📋 *ÚLTIMOS PEDIDOS:*\n\n`;
            
            const ultimosPedidos = infoCliente.pedidos.slice(-5).reverse();
            
            ultimosPedidos.forEach((pedido, index) => {
                respuesta += `${index + 1}. *${pedido.id}* - ${formatearFecha(pedido.fecha)}\n`;
                respuesta += `   💰 Total: $${pedido.total}\n`;
                respuesta += `   📦 Productos:\n`;
                
                pedido.productos.slice(0, 3).forEach(prod => {
                    respuesta += `      • ${prod.nombre} x${prod.cantidad}\n`;
                });
                
                if (pedido.productos.length > 3) {
                    respuesta += `      • ... y ${pedido.productos.length - 3} más\n`;
                }
                
                respuesta += `   🚚 Entrega: ${pedido.tipo_entrega === 'delivery' ? 'Delivery' : 'Retiro'}\n`;
                respuesta += `   ✅ Estado: ${pedido.estado}\n\n`;
            });
            
            if (infoCliente.pedidos.length > 5) {
                respuesta += `... y ${infoCliente.pedidos.length - 5} pedidos más\n\n`;
            }
        }
        
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n`;
        respuesta += `🙏 ¡Gracias por tu preferencia!\n\n`;
        respuesta += `¿Deseas hacer un nuevo pedido? 🛒`;
        
        return respuesta;
    }

    /**
     * Muestra la lista de categorías de productos
     * ✅ CORREGIDO: Ahora recibe el parámetro 'from'
     */
    mostrarCatalogo(from) {
        sessionManager.marcarSesionActiva(from, 'consulta');
        return productService.generarListaCategorias();
    }

    /**
     * Muestra los horarios de atención
     */
    mostrarHorarios(from) {
        sessionManager.marcarSesionActiva(from, 'consulta');
        const negocio = cache.obtenerNegocioSync();
        return `🕐 *Horarios de Atención*\n\n${negocio.horarios}`;
    }

    /**
     * Muestra la ubicación del negocio
     */
    mostrarUbicacion(from) {
        sessionManager.marcarSesionActiva(from, 'consulta');
        const negocio = cache.obtenerNegocioSync();
        return `📍 *Nuestra Ubicación*\n\n${negocio.direccion}\n\nTe esperamos! 😊`;
    }

    /**
     * Muestra los medios de pago disponibles
     */
    mostrarMediosPago(from) {
        sessionManager.marcarSesionActiva(from, 'consulta');
        const negocio = cache.obtenerNegocioSync();
        return `💳 *Medios de Pago:*\n\n${negocio.medios_pago}`;
    }

    /**
     * Muestra información de contacto
     */
    mostrarContacto(from) {
        sessionManager.marcarSesionActiva(from, 'consulta');
        const negocio = cache.obtenerNegocioSync();
        return `📞 *Contacto*\n\n` +
               `WhatsApp: ${negocio.whatsapp}\n` +
               `Teléfono: ${negocio.telefono}\n\n` +
               `¡Estamos para ayudarte! 😊`;
    }

    /**
     * Muestra información sobre stock
     */
    mostrarInfoStock(from) {
        sessionManager.marcarSesionActiva(from, 'consulta');
        return `📦 Para consultar stock específico, escribe el nombre del producto.\n\n` +
               `Ejemplo: "Hay cuadernos A4?"`;
    }
}

module.exports = new CommandHandler();