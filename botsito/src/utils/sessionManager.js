// src/utils/sessionManager.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🧠 SESSION MANAGER - Gestión de sesiones de conversación
 * ═══════════════════════════════════════════════════════════════
 */

const { TIEMPO_EXPIRACION_SESION } = require('../config/constants');

class SessionManager {
    constructor() {
        this.sesionesActivas = new Map();
        this.carritos = {};
        this.timersCarrito = {};
        
        // ✅ NUEVO: Lista de usuarios que pidieron atención humana
        this.atencionHumana = new Set();
        this.timersAtencionHumana = {}; // Timers para auto-reactivación
        
        // ✅ NUEVO: Sesiones de curriculum
        this.sessions = {};
    }

    /**
     * ✅ NUEVA FUNCIÓN: Marca que el usuario pidió atención humana
     */
    marcarAtencionHumana(from) {
        this.atencionHumana.add(from);
        this.limpiarSesion(from);
        
        console.log(`👤 Usuario ${from} marcado para atención humana`);
        
        // ✅ Auto-reactivar bot después de 1 hora
        if (this.timersAtencionHumana[from]) {
            clearTimeout(this.timersAtencionHumana[from]);
        }
        
        this.timersAtencionHumana[from] = setTimeout(() => {
            this.liberarAtencionHumana(from);
            console.log(`⏰ Bot auto-reactivado para ${from} (1 hora sin respuesta)`);
        }, 60 * 60 * 1000); // 1 hora
    }

    /**
     * ✅ NUEVA FUNCIÓN: Verifica si el usuario está esperando atención humana
     */
    requiereAtencionHumana(from) {
        return this.atencionHumana.has(from);
    }

    /**
     * ✅ NUEVA FUNCIÓN: Libera al usuario de atención humana (vuelve al bot)
     */
    liberarAtencionHumana(from) {
        this.atencionHumana.delete(from);
        
        // Limpiar timer si existe
        if (this.timersAtencionHumana[from]) {
            clearTimeout(this.timersAtencionHumana[from]);
            delete this.timersAtencionHumana[from];
        }
        
        console.log(`🤖 Usuario ${from} liberado de atención humana`);
    }

    /**
     * ✅ NUEVO: Marca que el usuario está enviando datos de curriculum
     */
    marcarEnviandoCurriculum(from) {
        if (!this.sessions[from]) {
            this.sessions[from] = {};
        }
        this.sessions[from].enviando_curriculum = true;
        this.sessions[from].ultima_actividad = Date.now();
        
        console.log(`📄 Usuario ${from} marcado como enviando curriculum`);
    }

    /**
     * ✅ NUEVO: Verifica si está enviando curriculum
     */
    estaEnviandoCurriculum(from) {
        return this.sessions[from]?.enviando_curriculum === true;
    }

    /**
     * ✅ NUEVO: Limpia datos de curriculum
     */
    limpiarDatosCurriculum(from) {
        if (this.sessions[from]) {
            delete this.sessions[from].enviando_curriculum;
        }
        
        console.log(`📄 Datos de curriculum limpiados para ${from}`);
    }

    /**
     * Marca una sesión como activa
     */
    marcarSesionActiva(from, tipo = 'conversacion') {
        this.sesionesActivas.set(from, {
            tipo: tipo,
            timestamp: Date.now()
        });
        
        // Auto-expiración
        setTimeout(() => {
            if (this.sesionesActivas.has(from)) {
                const sesion = this.sesionesActivas.get(from);
                if (Date.now() - sesion.timestamp >= TIEMPO_EXPIRACION_SESION) {
                    this.sesionesActivas.delete(from);
                    console.log(`🕐 Sesión expirada para: ${from}`);
                }
            }
        }, TIEMPO_EXPIRACION_SESION);
    }

    /**
     * Verifica si tiene sesión activa
     */
    tieneSesionActiva(from) {
        if (!this.sesionesActivas.has(from)) return false;
        
        const sesion = this.sesionesActivas.get(from);
        const tiempoTranscurrido = Date.now() - sesion.timestamp;
        
        if (tiempoTranscurrido >= TIEMPO_EXPIRACION_SESION) {
            this.sesionesActivas.delete(from);
            return false;
        }
        
        return true;
    }

    /**
     * Limpia una sesión
     */
    limpiarSesion(from) {
        this.sesionesActivas.delete(from);
    }

    /**
     * Obtiene el carrito de un usuario
     */
    obtenerCarrito(from) {
        if (!this.carritos[from]) {
            this.carritos[from] = {
                productos: [],
                temporal: []
            };
        }
        return this.carritos[from];
    }

    /**
     * Actualiza el carrito
     */
    actualizarCarrito(from, carrito) {
        this.carritos[from] = carrito;
    }

    /**
     * Elimina un carrito
     */
    eliminarCarrito(from) {
        delete this.carritos[from];
        
        if (this.timersCarrito[from]) {
            clearTimeout(this.timersCarrito[from]);
            delete this.timersCarrito[from];
        }
    }

    /**
     * Inicia timer de expiración de carrito
     */
    iniciarTimerCarrito(from, minutos = 15) {
        if (this.timersCarrito[from]) {
            clearTimeout(this.timersCarrito[from]);
        }
        
        this.timersCarrito[from] = setTimeout(() => {
            if (this.carritos[from]) {
                delete this.carritos[from];
                delete this.timersCarrito[from];
                console.log(`⏰ Carrito expirado para: ${from}`);
            }
        }, minutos * 60 * 1000);
    }

    /**
     * Limpia todas las sesiones y carritos
     */
    limpiarTodo() {
        this.sesionesActivas.clear();
        this.atencionHumana.clear();
        
        Object.keys(this.carritos).forEach(key => delete this.carritos[key]);
        
        Object.keys(this.timersCarrito).forEach(key => {
            clearTimeout(this.timersCarrito[key]);
            delete this.timersCarrito[key];
        });
        
        Object.keys(this.timersAtencionHumana).forEach(key => {
            clearTimeout(this.timersAtencionHumana[key]);
            delete this.timersAtencionHumana[key];
        });
        
        Object.keys(this.sessions).forEach(key => delete this.sessions[key]);
        
        console.log('🧹 Todas las sesiones y carritos limpiados');
    }

    /**
     * Obtiene estadísticas
     */
    obtenerEstadisticas() {
        return {
            sesionesActivas: this.sesionesActivas.size,
            carritosActivos: Object.keys(this.carritos).length,
            timersActivos: Object.keys(this.timersCarrito).length,
            atencionHumana: this.atencionHumana.size,
            curriculumActivos: Object.keys(this.sessions).filter(k => this.sessions[k].enviando_curriculum).length
        };
    }
}

module.exports = new SessionManager();