// src/utils/rateLimiter.js
/**
 * ═══════════════════════════════════════════════════════════════
 * ⏱️ RATE LIMITER - Control de límite de mensajes por usuario
 * ═══════════════════════════════════════════════════════════════
 */

const logger = require('../middlewares/logger');

class RateLimiter {
    constructor() {
        // Map para rastrear mensajes por usuario
        this.userMessages = new Map();
        
        // Configuración por defecto
        this.config = {
            maxMessages: 25,           // Máximo de mensajes
            windowMs: 60000,           // Ventana de tiempo (1 minuto)
            blockDurationMs: 300000,   // Duración del bloqueo (5 minutos)
            warningThreshold: 7        // Advertencia a partir de este número
        };

        // Map para usuarios bloqueados
        this.blockedUsers = new Map();

        // Limpiar datos antiguos cada 5 minutos
        setInterval(() => this.limpiarDatosAntiguos(), 300000);
    }

    /**
     * Verifica si un usuario ha excedido el límite de mensajes
     */
    verificarLimite(userId) {
        const now = Date.now();

        // Verificar si el usuario está bloqueado
        if (this.blockedUsers.has(userId)) {
            const blockInfo = this.blockedUsers.get(userId);
            
            if (now < blockInfo.until) {
                const minutosRestantes = Math.ceil((blockInfo.until - now) / 60000);
                logger.warn(`🚫 Usuario bloqueado: ${userId} (${minutosRestantes} min restantes)`);
                
                return {
                    allowed: false,
                    blocked: true,
                    minutosRestantes,
                    mensaje: `⚠️ Has enviado demasiados mensajes.\n\n` +
                            `Por favor, espera ${minutosRestantes} minuto(s) antes de continuar.\n\n` +
                            `Esto es para evitar spam y mantener el servicio funcionando correctamente. 🙏`
                };
            } else {
                // Desbloquear usuario
                this.blockedUsers.delete(userId);
                logger.info(`✅ Usuario desbloqueado: ${userId}`);
            }
        }

        // Obtener historial de mensajes del usuario
        if (!this.userMessages.has(userId)) {
            this.userMessages.set(userId, []);
        }

        const userMessageLog = this.userMessages.get(userId);

        // Filtrar solo mensajes dentro de la ventana de tiempo
        const recentMessages = userMessageLog.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        // Actualizar el log con solo mensajes recientes
        this.userMessages.set(userId, recentMessages);

        // Verificar si excedió el límite
        if (recentMessages.length >= this.config.maxMessages) {
            // Bloquear usuario
            this.blockedUsers.set(userId, {
                until: now + this.config.blockDurationMs,
                blockedAt: now
            });

            logger.warn(`🚫 Usuario bloqueado por spam: ${userId}`);

            return {
                allowed: false,
                blocked: true,
                minutosRestantes: Math.ceil(this.config.blockDurationMs / 60000),
                mensaje: `⚠️ *Has excedido el límite de mensajes*\n\n` +
                        `Has sido bloqueado temporalmente por ${Math.ceil(this.config.blockDurationMs / 60000)} minutos.\n\n` +
                        `Por favor, espera antes de continuar enviando mensajes. 🙏`
            };
        }

        // Advertencia si está cerca del límite
        if (recentMessages.length >= this.config.warningThreshold) {
            const mensajesRestantes = this.config.maxMessages - recentMessages.length;
            logger.warn(`⚠️ Usuario cerca del límite: ${userId} (${recentMessages.length}/${this.config.maxMessages})`);

            return {
                allowed: true,
                warning: true,
                mensajesRestantes,
                mensaje: `⚠️ *Atención*: Te quedan ${mensajesRestantes} mensajes antes del límite temporal.\n\nPor favor, envía tus consultas de forma clara y concisa. 🙏`
            };
        }

        // Registrar el nuevo mensaje
        recentMessages.push(now);
        this.userMessages.set(userId, recentMessages);

        return {
            allowed: true,
            blocked: false,
            warning: false
        };
    }

    /**
     * Limpia datos antiguos de usuarios inactivos
     */
    limpiarDatosAntiguos() {
        const now = Date.now();
        let cleaned = 0;

        // Limpiar mensajes antiguos
        for (const [userId, messages] of this.userMessages.entries()) {
            const recentMessages = messages.filter(
                timestamp => now - timestamp < this.config.windowMs * 2
            );

            if (recentMessages.length === 0) {
                this.userMessages.delete(userId);
                cleaned++;
            } else {
                this.userMessages.set(userId, recentMessages);
            }
        }

        // Limpiar bloqueos expirados
        for (const [userId, blockInfo] of this.blockedUsers.entries()) {
            if (now >= blockInfo.until) {
                this.blockedUsers.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`🧹 Rate limiter: ${cleaned} entradas limpiadas`);
        }
    }

    /**
     * Desbloquea manualmente a un usuario (para el dueño)
     */
    desbloquearUsuario(userId) {
        if (this.blockedUsers.has(userId)) {
            this.blockedUsers.delete(userId);
            this.userMessages.delete(userId);
            logger.info(`✅ Usuario desbloqueado manualmente: ${userId}`);
            return true;
        }
        return false;
    }

    /**
     * Obtiene estadísticas del rate limiter
     */
    obtenerEstadisticas() {
        return {
            usuariosActivos: this.userMessages.size,
            usuariosBloqueados: this.blockedUsers.size,
            configuracion: this.config
        };
    }

    /**
     * Configura los límites del rate limiter
     */
    configurar(opciones) {
        this.config = { ...this.config, ...opciones };
        logger.info('⚙️ Rate limiter reconfigurado:', this.config);
    }

    /**
     * Resetea todos los datos (útil para testing)
     */
    reset() {
        this.userMessages.clear();
        this.blockedUsers.clear();
        logger.info('🔄 Rate limiter reseteado');
    }
}

module.exports = new RateLimiter();