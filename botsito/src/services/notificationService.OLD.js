// src/services/notificationService.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🔔 NOTIFICATION SERVICE - Gestión de notificaciones
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const cache = require('../utils/CacheManager');
const { formatearFecha, limpiarTelefono } = require('../utils/textHelpers');
const logger = require('../middlewares/logger');

class NotificationService {
    constructor() {
        this.client = null;
    }

    /**
     * Inicializa el servicio con el cliente de WhatsApp
     */
    inicializar(whatsappClient) {
        this.client = whatsappClient;
        logger.info('✅ NotificationService inicializado');
    }

    /**
     * Verifica si las notificaciones están activas
     */
    estanActivas() {
        try {
            const negocio = cache.obtenerNegocioSync();
            return negocio.notificaciones_activas === true;
        } catch (error) {
            logger.error('❌ Error verificando estado de notificaciones:', error);
            return false;
        }
    }

    /**
     * ✅ CORREGIDO: Genera mensaje ultra simple sin caracteres problemáticos
     */
    generarMensajeNuevoPedido(pedido, telefonoCliente, nombreCliente) {
        try {
            const telefonoLimpio = limpiarTelefono(telefonoCliente);
            
            // ✅ Mensaje ULTRA simplificado - Sin emojis al inicio
            let mensaje = `NUEVO PEDIDO RECIBIDO\n\n`;
            mensaje += `Pedido: ${pedido.id}\n`;
            mensaje += `Cliente: ${nombreCliente}\n`;
            mensaje += `Telefono: ${telefonoLimpio}\n`;
            mensaje += `----------------------------\n\n`;
            
            mensaje += `PRODUCTOS:\n`;
            pedido.productos.forEach((prod, index) => {
                mensaje += `${index + 1}. ${prod.nombre} x${prod.cantidad}\n`;
                mensaje += `   $${prod.precio_unitario} c/u = $${prod.subtotal}\n`;
            });
            
            mensaje += `\n----------------------------\n`;
            mensaje += `Subtotal: $${pedido.subtotal}\n`;
            
            if (pedido.descuento > 0) {
                mensaje += `Descuento (${pedido.descuento_porcentaje}%): -$${pedido.descuento}\n`;
            }
            
            if (pedido.delivery > 0) {
                mensaje += `Delivery: +$${pedido.delivery}\n`;
            }
            
            mensaje += `----------------------------\n`;
            mensaje += `TOTAL: $${pedido.total}\n\n`;
            
            mensaje += `Entrega: ${pedido.tipo_entrega === 'delivery' ? 'Delivery' : 'Retiro en local'}\n`;
            mensaje += `Estado de pago: ${pedido.estado_pago || 'Pendiente'}\n`;
            mensaje += `Estado: ${pedido.estado}\n\n`;
            
            mensaje += `Para contactar: https://wa.me/${telefonoLimpio}`;
            
            return mensaje;
        } catch (error) {
            logger.error('❌ Error generando mensaje de notificación:', error);
            // Mensaje de fallback MUY simple
            return `Nuevo pedido ${pedido.id} de ${nombreCliente}. Total: $${pedido.total}`;
        }
    }

    /**
     * ✅ CORREGIDO: Envía notificación de nuevo pedido con logs extensos
     */
    async notificarNuevoPedido(pedido, telefonoCliente, nombreCliente, sock) {
        try {
            if (!this.estanActivas()) {
                logger.debug('🔕 Notificaciones desactivadas');
                return { success: false, razon: 'Notificaciones desactivadas' };
            }

            // ✅ CORREGIDO: Usar sock del parámetro, fallback a this.client
            const clienteWhatsApp = sock || this.client;
            
            if (!clienteWhatsApp) {
                logger.error('❌ Cliente de WhatsApp no inicializado');
                return { success: false, razon: 'Cliente no disponible' };
            }

            const mensaje = this.generarMensajeNuevoPedido(pedido, telefonoCliente, nombreCliente);
            
            // ✅ Validar mensaje
            if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
                logger.error('❌ Mensaje de notificación vacío o inválido');
                return { success: false, razon: 'Mensaje inválido' };
            }
            
            // 🔍 DEBUG: Ver contenido exacto del mensaje
            logger.info('═══════════════════════════════════════');
            logger.info('📧 MENSAJE COMPLETO A ENVIAR:');
            logger.info('═══════════════════════════════════════');
            logger.info(mensaje);
            logger.info('═══════════════════════════════════════');
            logger.info('📊 Longitud:', mensaje.length);
            logger.info('📊 Tipo:', typeof mensaje);
            logger.info('📊 Primeros 50 chars:', JSON.stringify(mensaje.substring(0, 50)));
            logger.info('📊 Últimos 50 chars:', JSON.stringify(mensaje.substring(mensaje.length - 50)));
            logger.info('📊 Bytes del mensaje:', Buffer.from(mensaje).length);
            logger.info('═══════════════════════════════════════\n');
            
            // ✅ CORREGIDO: Leer directamente del archivo para evitar problemas de caché
            const negocioPath = path.join(__dirname, '../../data/negocio.json');
            const negocioRaw = JSON.parse(fs.readFileSync(negocioPath, 'utf-8'));
            
            let notificacionEnviada = false;
            
            // Intentar enviar a grupo primero
            if (negocioRaw.grupo_notificaciones && 
                negocioRaw.grupo_notificaciones.trim() !== '' &&
                negocioRaw.grupo_notificaciones.includes('@g.us')) {
                
                try {
                    logger.info(`🔄 Intentando enviar al grupo: ${negocioRaw.grupo_notificaciones}`);
                    await clienteWhatsApp.sendMessage(negocioRaw.grupo_notificaciones, { 
                        text: mensaje.trim() 
                    });
                    logger.info(`✅ Notificación enviada al grupo: ${pedido.id}`);
                    notificacionEnviada = true;
                } catch (errorGrupo) {
                    logger.warn(`⚠️ Error al enviar al grupo: ${errorGrupo.message}`);
                    logger.warn(`⚠️ Error completo:`, errorGrupo);
                }
            }
            
            // Si no se envió al grupo, enviar a dueños individuales
            if (!notificacionEnviada) {
                // ✅ CORREGIDO: Buscar en todos los campos posibles
                let dueños = negocioRaw.numeros_dueños || 
                             negocioRaw.numeros_duenos || 
                             negocioRaw.numero_dueño || 
                             negocioRaw.numero_dueno ||
                             negocioRaw['numero_dueño'];
                
                logger.info(`🔍 DEBUG - Campos encontrados:`, {
                    'numeros_dueños': negocioRaw.numeros_dueños,
                    'valor seleccionado': dueños
                });
                
                // Si es string, convertir a array
                if (typeof dueños === 'string') {
                    dueños = dueños.split(',').map(num => num.trim()).filter(num => num !== '');
                    logger.info(`✅ Convertido de string a array: ${dueños.length} números`);
                } else if (!Array.isArray(dueños)) {
                    dueños = dueños ? [dueños] : [];
                }
                
                if (dueños.length === 0) {
                    logger.warn('⚠️ No hay números de dueños configurados');
                    return { success: false, razon: 'No hay destinatarios configurados' };
                }
                
                logger.info(`📤 Enviando notificación a ${dueños.length} dueño(s): ${dueños.join(', ')}`);
                
                for (const numeroDueño of dueños) {
                    if (!numeroDueño || numeroDueño.trim() === '') continue;
                    
                    const numeroLimpio = numeroDueño.trim();
                    
                    try {
                        logger.info(`🔄 Intentando enviar a: ${numeroLimpio}`);
                        await clienteWhatsApp.sendMessage(numeroLimpio, { 
                            text: mensaje.trim() 
                        });
                        logger.info(`✅ Notificación enviada a: ${numeroLimpio}`);
                        notificacionEnviada = true;
                        
                        // Pequeño delay entre mensajes
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (errorIndividual) {
                        logger.error(`❌ Error al notificar a ${numeroLimpio}:`, errorIndividual.message);
                        logger.error(`❌ Stack:`, errorIndividual.stack);
                    }
                }
            }
            
            if (!notificacionEnviada) {
                logger.warn('⚠️ No se pudo enviar notificación a ningún destinatario');
                return { success: false, razon: 'No se pudo enviar a ningún destinatario' };
            }
            
            return { success: true, pedidoId: pedido.id };
            
        } catch (error) {
            logger.error('❌ Error al enviar notificación:', error);
            logger.error('Stack completo:', error.stack);
            return { success: false, razon: error.message };
        }
    }

    /**
     * ✅ CORREGIDO: Envía notificación personalizada
     */
    async enviarNotificacion(destinatario, mensaje) {
        try {
            if (!this.client) {
                throw new Error('Cliente de WhatsApp no inicializado');
            }

            // ✅ Validar mensaje
            if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
                throw new Error('Mensaje vacío o inválido');
            }

            await this.client.sendMessage(destinatario, { 
                text: mensaje.trim() 
            });
            logger.info(`✅ Notificación personalizada enviada a: ${destinatario}`);
            
            return { success: true };
            
        } catch (error) {
            logger.error('❌ Error enviando notificación personalizada:', error);
            throw error;
        }
    }

    /**
     * Envía notificación masiva a múltiples destinatarios
     */
    async enviarNotificacionMasiva(destinatarios, mensaje, delay = 1000) {
        const resultados = {
            exitosos: 0,
            fallidos: 0,
            errores: []
        };

        for (const destinatario of destinatarios) {
            try {
                await this.enviarNotificacion(destinatario, mensaje);
                resultados.exitosos++;
                
                // Delay entre mensajes para evitar rate limit
                if (destinatario !== destinatarios[destinatarios.length - 1]) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                resultados.fallidos++;
                resultados.errores.push({
                    destinatario,
                    error: error.message
                });
            }
        }

        logger.info(`📊 Notificación masiva completada: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
        
        return resultados;
    }
}

module.exports = new NotificationService();