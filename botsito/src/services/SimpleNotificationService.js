// src/services/SimpleNotificationService.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🔔 SIMPLE NOTIFICATION SERVICE - Notificaciones simplificadas
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const logger = require('../middlewares/logger');

class SimpleNotificationService {
    constructor() {
        this.client = null;
    }

    /**
     * Inicializa el servicio con el cliente de WhatsApp
     */
    inicializar(whatsappClient) {
        this.client = whatsappClient;
        logger.info('✅ SimpleNotificationService inicializado');
    }

    /**
     * ✅ MENSAJE COMPLETO Y BONITO
     */
    generarMensaje(pedido, nombreCliente, telefono) {
        // Limpiar teléfono
        const tel = telefono.replace('@c.us', '');
        
        // Formatear fecha
        const fecha = new Date(pedido.fecha);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        const hora = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        const fechaFormateada = `${dia}/${mes}/${año} ${hora}:${minutos}`;
        
        // Mensaje bonito y completo
        let msg = `🔔 *NUEVO PEDIDO RECIBIDO*\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📄 *Pedido:* ${pedido.id}\n`;
        msg += `👤 *Cliente:* ${nombreCliente}\n`;
        msg += `📱 *Teléfono:* ${tel}\n`;
        msg += `📅 *Fecha:* ${fechaFormateada}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        msg += `📦 *PRODUCTOS:*\n`;
        pedido.productos.forEach((p, i) => {
            msg += `${i + 1}. ${p.nombre} x${p.cantidad}\n`;
            msg += `   $${p.precio_unitario} c/u = $${p.subtotal}\n`;
        });
        
        msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💰 *Subtotal:* $${pedido.subtotal}\n`;
        
        if (pedido.descuento > 0) {
            msg += `🎁 *Descuento* (${pedido.descuento_porcentaje}%): -$${pedido.descuento}\n`;
        }
        
        if (pedido.delivery > 0) {
            msg += `🚚 *Delivery:* +$${pedido.delivery}\n`;
        }
        
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💰 *TOTAL: $${pedido.total}*\n\n`;
        
        msg += `🚚 *Entrega:* ${pedido.tipo_entrega === 'delivery' ? 'Delivery' : 'Retiro en local'}\n`;
        msg += `💳 *Estado de pago:* ${pedido.estado_pago || 'Pendiente'}\n`;
        msg += `✅ *Estado:* ${pedido.estado}\n\n`;
        
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📲 *Para contactar al cliente:*\n`;
        msg += `https://wa.me/${tel}\n\n`;
        msg += `💡 Responde desde tu WhatsApp para coordinar.`;
        
        return msg;
    }

    /**
     * Envía usando el método directo de whatsapp-web.js
     */
    async enviarANumero(numero, mensaje) {
        try {
            if (!this.client) {
                logger.error('Cliente no disponible');
                return false;
            }

            // Asegurar formato correcto
            let numeroFormateado = numero;
            if (!numero.includes('@')) {
                numeroFormateado = `${numero}@c.us`;
            }
            
            logger.info(`📤 Enviando a: ${numeroFormateado}`);
            
            await this.client.sendMessage(numeroFormateado, mensaje);
            
            logger.info(`✅ Enviado a: ${numeroFormateado}`);
            return true;
            
        } catch (error) {
            logger.error(`❌ Error enviando a ${numero}:`, error.message);
            return false;
        }
    }

    /**
     * Método específico para grupos
     */
    async enviarAGrupo(grupoId, mensaje) {
        try {
            if (!this.client) {
                logger.error('Cliente no disponible');
                return false;
            }
            
            logger.info(`📤 Enviando al grupo: ${grupoId}`);
            
            // Verificar que el grupo existe
            const chats = await this.client.getChats();
            const grupo = chats.find(chat => chat.id._serialized === grupoId);
            
            if (!grupo) {
                logger.error(`❌ Grupo no encontrado: ${grupoId}`);
                logger.warn('💡 El bot podría no ser miembro del grupo o el ID es incorrecto');
                return false;
            }
            
            // Enviar mensaje
            await this.client.sendMessage(grupoId, mensaje);
            
            logger.info(`✅ Enviado al grupo: ${grupoId}`);
            return true;
            
        } catch (error) {
            logger.error(`❌ Error enviando al grupo ${grupoId}:`, error.message);
            
            if (error.message.includes('Evaluation failed')) {
                logger.warn('💡 Posibles causas:');
                logger.warn('   1. El mensaje tiene caracteres que WhatsApp rechaza');
                logger.warn('   2. El bot no tiene permisos en el grupo');
                logger.warn('   3. El grupo tiene restricciones de envío');
            }
            
            return false;
        }
    }

    /**
     * Notifica nuevo pedido
     */
    async notificar(pedido, nombreCliente, telefono, sock) {
        try {
            // Usar sock si está disponible
            const whatsapp = sock || this.client;
            this.client = whatsapp;
            
            // Leer configuración
            const negocioPath = path.join(__dirname, '../../data/negocio.json');
            const negocio = JSON.parse(fs.readFileSync(negocioPath, 'utf-8'));
            
            // Verificar si está activo
            if (!negocio.notificaciones_activas) {
                logger.info('🔕 Notificaciones desactivadas');
                return { success: false, razon: 'Desactivadas' };
            }
            
            // Generar mensaje bonito
            const mensaje = this.generarMensaje(pedido, nombreCliente, telefono);
            
            logger.info('═══════════════════════════════════');
            logger.info('📧 MENSAJE A ENVIAR:');
            logger.info(mensaje);
            logger.info(`📊 Longitud: ${mensaje.length} caracteres`);
            logger.info('═══════════════════════════════════');
            
            let enviados = 0;
            
            // Enviar a grupo
            if (negocio.grupo_notificaciones && negocio.grupo_notificaciones.trim() !== '') {
                const grupo = negocio.grupo_notificaciones.trim();
                if (grupo.includes('@g.us')) {
                    const ok = await this.enviarAGrupo(grupo, mensaje);
                    if (ok) enviados++;
                    await this.esperar(1000);
                }
            }
            
            // Enviar a dueños
            let dueños = [];
            
            if (negocio.numeros_dueños && Array.isArray(negocio.numeros_dueños)) {
                dueños = negocio.numeros_dueños;
            } else if (negocio.numero_dueño) {
                dueños = [negocio.numero_dueño];
            }
            
            logger.info(`👥 Dueños encontrados: ${dueños.length}`);
            
            for (const dueno of dueños) {
                if (!dueno || dueno.trim() === '') continue;
                
                logger.info(`📤 Enviando al dueño: ${dueno}`);
                const ok = await this.enviarANumero(dueno.trim(), mensaje);
                if (ok) enviados++;
                
                await this.esperar(500);
            }
            
            logger.info(`✅ Total enviados: ${enviados}`);
            
            return {
                success: enviados > 0,
                enviados,
                pedidoId: pedido.id
            };
            
        } catch (error) {
            logger.error('❌ Error en notificación:', error);
            return { success: false, razon: error.message };
        }
    }

    /**
     * ✅ NUEVO: Envía notificación personalizada
     */
    async notificarCustom(mensaje, sock) {
        try {
            const whatsapp = sock || this.client;
            this.client = whatsapp;
            
            // Leer configuración
            const negocioPath = path.join(__dirname, '../../data/negocio.json');
            const negocio = JSON.parse(fs.readFileSync(negocioPath, 'utf-8'));
            
            if (!negocio.notificaciones_activas) {
                logger.info('🔕 Notificaciones desactivadas');
                return { success: false };
            }
            
            let enviados = 0;
            
            // Enviar a grupo
            if (negocio.grupo_notificaciones && negocio.grupo_notificaciones.trim() !== '') {
                const grupo = negocio.grupo_notificaciones.trim();
                if (grupo.includes('@g.us')) {
                    const ok = await this.enviarAGrupo(grupo, mensaje);
                    if (ok) enviados++;
                    await this.esperar(1000);
                }
            }
            
            // Enviar a dueños
            let dueños = negocio.numeros_dueños || [];
            if (!Array.isArray(dueños) && negocio.numero_dueño) {
                dueños = [negocio.numero_dueño];
            }
            
            for (const dueno of dueños) {
                if (!dueno || dueno.trim() === '') continue;
                const ok = await this.enviarANumero(dueno.trim(), mensaje);
                if (ok) enviados++;
                await this.esperar(500);
            }
            
            return { success: enviados > 0, enviados };
            
        } catch (error) {
            logger.error('❌ Error en notificación custom:', error);
            return { success: false };
        }
    }

    /**
     * ✅ NUEVO: Envía media (foto) a los dueños
     */
    async notificarMedia(media, caption, sock) {
        try {
            const whatsapp = sock || this.client;
            this.client = whatsapp;
            
            const negocioPath = path.join(__dirname, '../../data/negocio.json');
            const negocio = JSON.parse(fs.readFileSync(negocioPath, 'utf-8'));
            
            if (!negocio.notificaciones_activas) {
                return { success: false };
            }
            
            let dueños = negocio.numeros_dueños || [];
            if (!Array.isArray(dueños) && negocio.numero_dueño) {
                dueños = [negocio.numero_dueño];
            }
            
            // Enviar foto a cada dueño
            for (const dueno of dueños) {
                if (!dueno || dueno.trim() === '') continue;
                
                try {
                    await whatsapp.sendMessage(dueno.trim(), media, { caption });
                    logger.info(`✅ Foto enviada a: ${dueno}`);
                    await this.esperar(500);
                } catch (error) {
                    logger.error(`❌ Error enviando foto a ${dueno}:`, error.message);
                }
            }
            
            // Enviar al grupo
            if (negocio.grupo_notificaciones && negocio.grupo_notificaciones.includes('@g.us')) {
                try {
                    await whatsapp.sendMessage(negocio.grupo_notificaciones, media, { caption });
                    logger.info(`✅ Foto enviada al grupo`);
                } catch (error) {
                    logger.error(`❌ Error enviando foto al grupo:`, error.message);
                }
            }
            
            return { success: true };
            
        } catch (error) {
            logger.error('❌ Error enviando media:', error);
            return { success: false };
        }
    }

    /**
     * Espera X milisegundos
     */
    esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new SimpleNotificationService();