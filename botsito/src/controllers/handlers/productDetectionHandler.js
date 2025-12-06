// src/controllers/handlers/productDetectionHandler.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🔍 PRODUCT DETECTION HANDLER - Detección de productos en texto
 * ═══════════════════════════════════════════════════════════════
 */

const productoIndex = require('../../utils/ProductoIndex');
const sessionManager = require('../../utils/sessionManager');
const logger = require('../../middlewares/logger');
const { NUMEROS_TEXTO } = require('../../config/constants');
const { MessageMedia } = require('whatsapp-web.js');

class ProductDetectionHandler {
    /**
     * Detecta productos en el texto
     */
    detectarProductos(texto) {
        logger.debug(`🔍 Buscando productos en: "${texto}"`);
        
        // Detectar cantidad
        let cantidadDetectada = 1;
        const regexNumero = /(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)/gi;
        const matches = texto.match(regexNumero);
        
        if (matches) {
            const ultimoMatch = matches[matches.length - 1].toLowerCase();
            cantidadDetectada = NUMEROS_TEXTO[ultimoMatch] || parseInt(ultimoMatch) || 1;
        }
        
        // Buscar productos usando el índice
        const resultados = productoIndex.buscar(texto);
        
        logger.debug(`   Resultados encontrados: ${resultados.length}`);
        
        // Formatear resultados
        const productosDetectados = resultados.map(producto => ({
            nombre: producto.nombreOriginal,
            nombreFormateado: producto.nombreFormateado,
            cantidad: cantidadDetectada,
            precio: producto.precio,
            stock: producto.stock,
            categoria: producto.categoria,
            subcategoria: producto.subcategoria,
            imagenes: producto.imagenes || []
        }));
        
        return productosDetectados;
    }

    /**
     * Procesa la detección de productos y genera respuesta
     * ✅ MODIFICADO: Respuestas más conversacionales
     */
    async procesarDeteccion(from, productos, sock) {
        if (productos.length === 0) {
            return `🤔 No encontré productos específicos en tu mensaje.\n\n` +
                   `Intenta escribir algo como:\n` +
                   `"Quiero 2 cuadernos A4"\n` +
                   `"Dame 5 lapiceras"\n` +
                   `"Necesito 3 globos"`;
        }
        
        // ✅ SIEMPRE mostrar opciones de forma conversacional
        if (productos.length > 1) {
            return await this.mostrarOpcionesConversacional(from, productos, sock);
        }
        
        // Si hay UN ÚNICO producto
        return await this.mostrarProductoUnico(from, productos, sock);
    }

    /**
     * ✅ NUEVA FUNCIÓN: Muestra opciones de forma conversacional (sin bloquear)
     */
    async mostrarOpcionesConversacional(from, productos, sock) {
        logger.info(`📋 Mostrando ${productos.length} opciones de forma conversacional`);
        
        let respuesta = `✅ *Tenemos ${productos.length} opciones:*\n\n`;
        
        productos.slice(0, 10).forEach((prod, index) => {
            const numero = index + 1;
            const stockEmoji = prod.stock ? '✅' : '❌';
            
            respuesta += `${numero}. ${stockEmoji} *${prod.nombreFormateado}*\n`;
            respuesta += `   💰 $${prod.precio}${prod.stock ? '' : ' (SIN STOCK)'}\n`;
            
            // Indicar si tiene fotos
            if (prod.imagenes && prod.imagenes.length > 0) {
                respuesta += `   📸 ${prod.imagenes.length} foto${prod.imagenes.length > 1 ? 's' : ''}\n`;
            }
            
            respuesta += `\n`;
        });
        
        if (productos.length > 10) {
            respuesta += `... y ${productos.length - 10} más\n\n`;
        }
        
        respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `💬 *¿Qué querés hacer?*\n`;
        respuesta += `• Escribe el número para agregarlo\n`;
        respuesta += `• Pregunta por más productos\n`;
        respuesta += `• Escribe "foto" para ver imágenes\n`;
        respuesta += `• O "ver carrito" para revisar tu pedido`;
        
        // ✅ Guardar opciones pero NO bloquear la conversación
        const carrito = sessionManager.obtenerCarrito(from);
        carrito.opciones_multiples = productos;
        carrito.cantidad_solicitada = productos[0].cantidad;
        carrito.ultimo_producto_consultado = productos;
        sessionManager.actualizarCarrito(from, carrito);
        
        return respuesta;
    }

    /**
     * ✅ NUEVA FUNCIÓN: Muestra un producto único de forma conversacional
     */
    async mostrarProductoUnico(from, productos, sock) {
        logger.info(`📦 Mostrando 1 producto de forma conversacional`);
        
        const prod = productos[0];
        const stockEmoji = prod.stock ? '✅' : '❌';
        const precioTotal = prod.precio * prod.cantidad;
        
        let respuesta = `✅ *Encontré:*\n\n`;
        respuesta += `${stockEmoji} *${prod.nombreFormateado}*\n`;
        respuesta += `💰 Precio: $${prod.precio}\n`;
        
        if (prod.cantidad > 1) {
            respuesta += `📊 Cantidad: ${prod.cantidad}\n`;
            respuesta += `💵 Total: $${precioTotal}\n`;
        }
        
        if (prod.imagenes && prod.imagenes.length > 0) {
            respuesta += `📸 Tiene ${prod.imagenes.length} foto${prod.imagenes.length > 1 ? 's' : ''} disponible${prod.imagenes.length > 1 ? 's' : ''}\n`;
        }
        
        if (!prod.stock) {
            respuesta += `\n⚠️ *SIN STOCK actualmente*\n`;
        }
        
        respuesta += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `💬 *¿Qué querés hacer?*\n`;
        respuesta += `• Escribe "si" para agregarlo al carrito\n`;
        respuesta += `• Escribe "foto" para ver imágenes\n`;
        respuesta += `• Pregunta por más productos\n`;
        respuesta += `• O "ver carrito" para revisar tu pedido`;
        
        // Guardar en temporal
        const carrito = sessionManager.obtenerCarrito(from);
        carrito.temporal = productos;
        carrito.ultimo_producto_consultado = productos;
        sessionManager.actualizarCarrito(from, carrito);
        
        return respuesta;
    }

    /**
     * ✅ FUNCIÓN ANTIGUA MANTENIDA: Para compatibilidad
     * (Ya no se usa directamente, pero la dejamos por si acaso)
     */
    async mostrarOpcionesMultiples(from, productos, sock) {
        return await this.mostrarOpcionesConversacional(from, productos, sock);
    }

    /**
     * ✅ FUNCIÓN ANTIGUA MANTENIDA: Para compatibilidad
     */
    async mostrarProductosEncontrados(from, productos, sock) {
        return await this.mostrarProductoUnico(from, productos, sock);
    }

    /**
     * Envía fotos de los productos consultados
     */
    async enviarFotosProducto(from, sock) {
        const carrito = sessionManager.obtenerCarrito(from);
        const productos = carrito.ultimo_producto_consultado || carrito.temporal;
        
        if (!productos || productos.length === 0) {
            return `🤔 No tengo productos guardados para mostrarte fotos.\n\nBusca un producto primero y luego pide la foto.`;
        }
        
        let fotosEnviadas = 0;
        
        for (const prod of productos) {
            if (prod.imagenes && prod.imagenes.length > 0) {
                try {
                    logger.info(`📸 Enviando ${prod.imagenes.length} foto(s) de: ${prod.nombreFormateado}`);
                    
                    // Enviar todas las fotos del producto
                    for (const imagen of prod.imagenes) {
                        const imageUrl = imagen.url;
                        const media = await MessageMedia.fromUrl(imageUrl);
                        
                        const caption = `📸 *${prod.nombreFormateado}*\n\n` +
                                      `${prod.stock ? '✅' : '❌'} Stock: ${prod.stock ? 'Disponible' : 'AGOTADO'}\n` +
                                      `💰 Precio: $${prod.precio}`;
                        
                        await sock.sendMessage(from, media, { caption });
                        
                        fotosEnviadas++;
                        
                        // Esperar un poco entre fotos
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                    
                } catch (error) {
                    logger.error(`❌ Error al enviar foto de ${prod.nombreFormateado}:`, error);
                }
            }
        }
        
        if (fotosEnviadas === 0) {
            return `😔 Este producto no tiene fotos disponibles aún.`;
        }
        
        return `✅ Foto${fotosEnviadas > 1 ? 's' : ''} enviada${fotosEnviadas > 1 ? 's' : ''}.\n\n💬 Seguí preguntando o escribe "si" para agregarlo al carrito`;
    }

    /**
     * Maneja la selección de un producto específico
     */
    async manejarSeleccion(textoOriginal, from, sock) {
        const carrito = sessionManager.obtenerCarrito(from);
        const numeroElegido = parseInt(textoOriginal.trim());
        
        if (!isNaN(numeroElegido) && numeroElegido > 0 && numeroElegido <= carrito.opciones_multiples.length) {
            const productoElegido = carrito.opciones_multiples[numeroElegido - 1];
            productoElegido.cantidad = carrito.cantidad_solicitada || 1;
            
            logger.info(`✅ Usuario eligió opción ${numeroElegido}: ${productoElegido.nombreFormateado}`);
            
            // ✅ NO eliminamos opciones_multiples, para permitir más selecciones
            
            carrito.temporal = [productoElegido];
            sessionManager.actualizarCarrito(from, carrito);
            
            return await this.mostrarProductoUnico(from, [productoElegido], sock);
        }
        
        if (textoOriginal.toLowerCase().match(/cancelar|no quiero|olvida/)) {
            delete carrito.opciones_multiples;
            delete carrito.cantidad_solicitada;
            sessionManager.actualizarCarrito(from, carrito);
            return `❌ Opciones canceladas.\n\n¿En qué más te puedo ayudar?`;
        }
        
        // ✅ Ya no devolvemos error, el flujo continúa en textMessageHandler
        return null;
    }
}

module.exports = new ProductDetectionHandler();