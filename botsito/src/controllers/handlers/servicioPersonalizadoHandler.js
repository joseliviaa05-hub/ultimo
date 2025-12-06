// src/controllers/handlers/servicioPersonalizadoHandler.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 📋 SERVICIO PERSONALIZADO HANDLER
 * ═══════════════════════════════════════════════════════════════
 */

const plantillas = require('../../config/plantillas');
const cache = require('../../utils/CacheManager');
const sessionManager = require('../../utils/sessionManager');
const curriculumHandler = require('./curriculumHandler');
const logger = require('../../middlewares/logger');

class ServicioPersonalizadoHandler {
    
    /**
     * Normaliza texto (quita acentos, símbolos, convierte a minúsculas)
     */
    _normalizar(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // Eliminar acentos
            .replace(/[¿?¡!,;.:()\[\]{}'"]/g, '')  // Eliminar símbolos
            .replace(/_/g, ' ')  // Reemplazar guiones bajos por espacios
            .replace(/-/g, ' ')  // Reemplazar guiones por espacios
            .trim();
    }
    
    /**
     * Detecta si el mensaje solicita un servicio personalizado
     */
    detectarServicio(textoLower) {
        const servicios = {
            curriculum: /curriculum|cv|curriculo|hoja de vida|resume|hacer (un|mi) curriculum|armar (un|mi) cv/,
            invitacion: /invitacion|invitaciones|tarjeta de invitacion|hacer invitaciones/,
            tarjeta: /tarjeta personal|tarjeta profesional|tarjetas personales|business card/
        };
        
        for (const [tipo, patron] of Object.entries(servicios)) {
            if (patron.test(textoLower)) {
                return tipo;
            }
        }
        
        return null;
    }
    
    /**
     * ✅ MEJORADO: Busca el servicio en TODA la lista de precios (todas las categorías)
     */
    existeServicioEnLista(tipoServicio) {
        try {
            const productos = cache.obtenerProductosSync();
            
            // Definir palabras clave para cada servicio
            const palabrasClave = {
                'curriculum': ['curriculum', 'cv', 'curriculum vitae', 'curriculo', 'hoja de vida', 'resume'],
                'invitacion': ['invitacion', 'invitaciones', 'tarjeta de invitacion'],
                'tarjeta': ['tarjeta personal', 'tarjeta profesional', 'tarjetas personales', 'business card']
            };
            
            const palabras = palabrasClave[tipoServicio] || [];
            
            // ✅ Buscar en TODAS las categorías y subcategorías
            for (const [categoria, subcategorias] of Object.entries(productos)) {
                for (const [subcategoria, items] of Object.entries(subcategorias)) {
                    for (const [nombreProducto, infoProducto] of Object.entries(items)) {
                        const nombreNormalizado = this._normalizar(nombreProducto);
                        
                        // Verificar si alguna palabra clave coincide con el nombre del producto
                        for (const palabra of palabras) {
                            const palabraNormalizada = this._normalizar(palabra);
                            
                            // Coincidencia exacta
                            if (nombreNormalizado === palabraNormalizada) {
                                logger.info(`✅ Servicio encontrado: ${nombreProducto} en ${categoria}/${subcategoria}`);
                                return {
                                    ...infoProducto,
                                    nombre: nombreProducto,
                                    categoria: categoria,
                                    subcategoria: subcategoria
                                };
                            }
                            
                            // Coincidencia parcial (contiene la palabra)
                            if (nombreNormalizado.includes(palabraNormalizada) || 
                                palabraNormalizada.includes(nombreNormalizado)) {
                                logger.info(`✅ Servicio encontrado (parcial): ${nombreProducto} en ${categoria}/${subcategoria}`);
                                return {
                                    ...infoProducto,
                                    nombre: nombreProducto,
                                    categoria: categoria,
                                    subcategoria: subcategoria
                                };
                            }
                        }
                    }
                }
            }
            
            logger.info(`❌ Servicio "${tipoServicio}" NO encontrado en inventario`);
            return null;
            
        } catch (error) {
            logger.error('❌ Error al verificar servicio en lista:', error);
            return null;
        }
    }
    
    /**
     * Genera respuesta con información del servicio
     * ✅ Solo responde si existe en lista de precios
     */
    generarRespuestaServicio(tipoServicio) {
        const plantilla = plantillas[tipoServicio];
        
        if (!plantilla) {
            return null;
        }
        
        // ✅ VERIFICAR SI EXISTE EN LA LISTA DE PRECIOS (en cualquier categoría)
        const servicioEnLista = this.existeServicioEnLista(tipoServicio);
        
        if (!servicioEnLista) {
            // ❌ NO está en la lista de precios - NO RESPONDER
            logger.info(`❌ Servicio "${tipoServicio}" NO encontrado en lista de precios - Ignorando consulta`);
            return null;
        }
        
        // ✅ SÍ está en la lista de precios - RESPONDER
        const precioActualizado = servicioEnLista.precio_desde 
            ? `desde $${servicioEnLista.precio_desde}` 
            : `$${servicioEnLista.precio}`;
        
        const tiempoEntrega = servicioEnLista.tiempo_entrega || plantilla.tiempo;
        
        let respuesta = `✅ *Sí, hacemos ${plantilla.nombre}!*\n\n`;
        respuesta += `💰 Precio: ${precioActualizado}\n`;
        respuesta += `⏱️ Tiempo de entrega: ${tiempoEntrega}\n`;
        
        if (servicioEnLista.descripcion) {
            respuesta += `📝 ${servicioEnLista.descripcion}\n`;
        }
        
        respuesta += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `📋 *DATOS QUE NECESITAMOS:*\n\n`;
        respuesta += plantilla.campos.join('\n');
        
        respuesta += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `📝 *CÓMO PROCEDER:*\n\n`;
        respuesta += plantilla.instrucciones.join('\n');
        
        respuesta += `\n\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `💬 *¿Cómo querés enviar los datos?*\n\n`;
        respuesta += `1️⃣ Enviarlos por WhatsApp ahora\n`;
        respuesta += `2️⃣ Enviar fotos de tus datos\n`;
        respuesta += `3️⃣ Traer la información al local\n\n`;
        respuesta += `Escribí el número de tu opción.`;
        
        logger.info(`✅ Servicio personalizado encontrado: ${servicioEnLista.nombre} en ${servicioEnLista.categoria}/${servicioEnLista.subcategoria}`);
        
        return respuesta;
    }
    
    /**
     * ✅ NUEVO: Maneja la selección de opción de envío con notificaciones
     */
    async manejarOpcionEnvio(from, opcion, tipoServicio, nombreCliente) {
        const plantilla = plantillas[tipoServicio];
        
        // Obtener info del negocio
        let infoNegocio = { direccion: 'Consultar', horarios: 'Consultar' };
        try {
            const negocio = cache.obtenerNegocioSync();
            infoNegocio = {
                direccion: negocio.direccion || 'Consultar',
                horarios: negocio.horarios_texto || negocio.horarios || 'Consultar'
            };
        } catch (error) {
            logger.error('❌ Error al obtener info del negocio:', error);
        }
        
        switch(opcion) {
            case '1':
                // ✅ Marcar que está enviando datos
                sessionManager.marcarEnviandoCurriculum(from);
                
                return `✅ *Perfecto!*\n\n` +
                       `Por favor, enviá los datos siguiendo este formato:\n\n` +
                       plantilla.campos.join('\n') +
                       `\n\n💡 *Tip:* Copiá y completá cada campo.\n\n` +
                       `Una vez que recibamos toda la información, te contactaremos para confirmar los detalles.`;
                       
            case '2':
                // ✅ Marcar que está enviando datos (puede enviar foto)
                sessionManager.marcarEnviandoCurriculum(from);
                
                return `📸 *Perfecto!*\n\n` +
                       `Enviá fotos claras de:\n` +
                       `• Tus datos personales\n` +
                       `• Documentos necesarios\n` +
                       `• Referencias (si tenés)\n\n` +
                       `Asegurate que se lean bien las fotos.\n\n` +
                       `Una vez que recibamos las fotos, te contactaremos para confirmar los detalles.`;
                       
            case '3':
                // ✅ NUEVO: Usar curriculumHandler para opción 3
                if (tipoServicio === 'curriculum') {
                    return await curriculumHandler.procesarTraerAlLocal(from, nombreCliente);
                }
                
                // Para otros servicios
                return `🏪 *Perfecto!*\n\n` +
                       `Podés traer la información al local:\n\n` +
                       `📍 *Dirección:* ${infoNegocio.direccion}\n` +
                       `🕐 *Horarios:* ${infoNegocio.horarios}\n\n` +
                       `Te esperamos! 😊\n\n` +
                       `Traé todos los datos necesarios y te ayudamos con el diseño.`;
                       
            default:
                return `❌ Opción no válida.\n\n` +
                       `Por favor, escribí:\n` +
                       `• *1* para enviar por WhatsApp\n` +
                       `• *2* para enviar fotos\n` +
                       `• *3* para traer al local`;
        }
    }

    /**
     * ✅ NUEVO: Procesa datos recibidos de curriculum
     */
    async procesarDatosRecibidos(from, nombreCliente, texto, sock) {
        try {
            // Verificar si es curriculum
            if (curriculumHandler.esDatosDeCurriculum(texto)) {
                logger.info(`📄 Detectados datos de curriculum de ${nombreCliente}`);
                return await curriculumHandler.procesarDatosCurriculum(from, nombreCliente, texto, sock);
            }
            
            return null;
            
        } catch (error) {
            logger.error('❌ Error procesando datos recibidos:', error);
            return null;
        }
    }

    /**
     * ✅ NUEVO: Procesa foto recibida de curriculum
     */
    async procesarFotoRecibida(from, nombreCliente, media, caption, sock) {
        try {
            // Si está esperando datos de curriculum
            if (sessionManager.estaEnviandoCurriculum(from)) {
                logger.info(`📷 Detectada foto de curriculum de ${nombreCliente}`);
                return await curriculumHandler.procesarFotoCurriculum(from, nombreCliente, media, caption, sock);
            }
            
            return null;
            
        } catch (error) {
            logger.error('❌ Error procesando foto recibida:', error);
            return null;
        }
    }
}

module.exports = new ServicioPersonalizadoHandler();