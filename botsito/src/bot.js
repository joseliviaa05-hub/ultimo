// src/bot.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 WHATSAPP BOT CLIENT - Gestión del cliente de WhatsApp
 * ═══════════════════════════════════════════════════════════════
 * Versión mejorada con:
 * - Reconexión automática
 * - Health checks periódicos
 * - Cierre graceful
 * - Manejo avanzado de errores
 * ═══════════════════════════════════════════════════════════════
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const messageController = require('./controllers/messageController');
const cache = require('./utils/CacheManager');
const productoIndex = require('./utils/ProductoIndex');
const logger = require('./middlewares/logger');

let botIniciadoEn = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let healthCheckInterval = null;

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL CLIENTE
// ═══════════════════════════════════════════════════════════════

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// ═══════════════════════════════════════════════════════════════
// EVENTOS DEL CLIENTE
// ═══════════════════════════════════════════════════════════════

/**
 * Evento: Código QR generado
 */
client.on('qr', (qr) => {
    logger.info('📱 Código QR generado');
    console.log('\n==============================================');
    console.log('📱 ¡ESCANEA ESTE CÓDIGO QR!');
    console.log('==============================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n==============================================');
    console.log('👆 Abre WhatsApp en tu celular');
    console.log('👉 Menú → Dispositivos vinculados');
    console.log('👉 Vincular un dispositivo');
    console.log('👉 Escanea el QR de arriba');
    console.log('==============================================\n');
});

/**
 * Evento: Bot autenticado y listo
 */
client.on('authenticated', () => {
    logger.info('✅ Autenticación exitosa');
});

/**
 * Evento: Bot completamente listo
 */
client.on('ready', async () => {
    try {
        // Resetear contador de reintentos al conectar exitosamente
        reconnectAttempts = 0;
        
        // Pre-cargar caché
        logger.info('📦 Precargando datos...');
        await cache.precargarTodo();
        
        // Construir índice de productos
        const productosParaIndice = cache.obtenerProductosSync();
        productoIndex.construirIndice(productosParaIndice);
        
        // Registrar hora de inicio
        botIniciadoEn = Date.now();
        
        // Logs de inicio
        logger.info('🎉 Bot de WhatsApp conectado exitosamente');
        logger.info(`⏰ Bot iniciado: ${new Date().toLocaleString('es-AR')}`);
        
        // Estadísticas
        const clientesData = cache.obtenerClientesSync();
        logger.info(`👥 Clientes registrados: ${clientesData.estadisticas?.total_clientes || 0}`);
        logger.info(`📦 Total pedidos: ${clientesData.estadisticas?.total_pedidos || 0}`);
        logger.info(`💰 Total vendido: $${clientesData.estadisticas?.total_vendido || 0}`);
        
        // Información del bot
        const info = client.info;
        if (info) {
            logger.info(`📱 WhatsApp conectado: ${info.pushname}`);
            logger.info(`📞 Número: ${info.wid.user}`);
        }
        
        // Iniciar health checks periódicos
        iniciarHealthChecks();

        // ✅ NUEVO: Inicializar servicio de notificaciones simple
        const simpleNotificationService = require('./services/SimpleNotificationService');
        simpleNotificationService.inicializar(client);
        logger.info('✅ SimpleNotificationService configurado');
        
        logger.info('✅ Bot completamente operativo');
        
    } catch (error) {
        logger.error('❌ Error al inicializar bot:', error);
        logger.error('Stack:', error.stack);
    }
});

/**
 * Evento: Mensaje recibido
 */
client.on('message', async (msg) => {
    try {
        const from = msg.from;
        const body = msg.body?.toLowerCase().trim() || '';
        const sessionManager = require('./utils/sessionManager');
        
        // ✅ COMANDO: Obtener ID de grupo
        if (body === '!getid' && from.includes('@g.us')) {
            await msg.reply(`🆔 *ID de este grupo:*\n\n\`\`\`${from}\`\`\`\n\n📋 Copia este ID y agrégalo en tu configuración.`);
            logger.info(`📋 ID de grupo solicitado: ${from}`);
            return;
        }
        
        // ✅ COMANDO: Obtener mi número
        if (body === '!miid' && !from.includes('@g.us')) {
            await msg.reply(`🆔 *Tu ID de WhatsApp:*\n\n\`\`\`${from}\`\`\`\n\n📋 Este es tu número con formato completo.`);
            logger.info(`📋 ID personal solicitado: ${from}`);
            return;
        }
        
        // Si el usuario pidió atención humana, el bot NO responde
        if (sessionManager.requiereAtencionHumana(from)) {
            logger.info(`🔇 Bot silenciado para ${from} - Esperando atención humana`);
            return;
        }

        // Pasar client como sock para enviar imágenes
        await messageController.handleMessage(msg, client, botIniciadoEn, client);
        
    } catch (error) {
        logger.error('❌ Error al procesar mensaje:', error);
        logger.error('Stack:', error.stack);
        
        try {
            await msg.reply('❌ Ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente en unos momentos.');
        } catch (replyError) {
            logger.error('❌ Error al enviar mensaje de error:', replyError);
        }
    }
});

/**
 * Evento: Cargando mensajes
 */
client.on('loading_screen', (percent, message) => {
    logger.info(`⏳ Cargando: ${percent}% - ${message}`);
});

/**
 * Evento: Error de autenticación
 */
client.on('auth_failure', (error) => {
    logger.error('❌ Error de autenticación:', error);
    logger.error('💡 Solución: Elimina la carpeta .wwebjs_auth/ y vuelve a escanear el QR');
    
    // Intentar limpiar la sesión corrupta
    try {
        const fs = require('fs');
        const path = require('path');
        const authPath = path.join(__dirname, '../.wwebjs_auth');
        
        if (fs.existsSync(authPath)) {
            logger.warn('🗑️ Eliminando sesión corrupta...');
            fs.rmSync(authPath, { recursive: true, force: true });
            logger.info('✅ Sesión eliminada. Por favor reinicia el bot.');
        }
    } catch (cleanupError) {
        logger.error('❌ Error al limpiar sesión:', cleanupError);
    }
});

/**
 * Evento: Bot desconectado
 */
client.on('disconnected', async (reason) => {
    logger.warn('⚠️ Bot desconectado:', reason);
    
    // Detener health checks
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
    
    // Intentar reconectar
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const waitTime = 5000 * reconnectAttempts; // Espera exponencial
        
        logger.info(`🔄 Intentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`);
        logger.info(`⏱️ Esperando ${waitTime / 1000} segundos antes de reconectar...`);
        
        setTimeout(async () => {
            try {
                logger.info('🔄 Reinicializando cliente...');
                await client.initialize();
            } catch (error) {
                logger.error('❌ Error al reconectar:', error);
                
                if (reconnectAttempts >= maxReconnectAttempts) {
                    logger.error('❌ Máximo de reintentos alcanzado.');
                    logger.error('💡 Por favor, reinicia el bot manualmente.');
                }
            }
        }, waitTime);
    } else {
        logger.error('❌ Máximo de reintentos de reconexión alcanzado.');
        logger.error('💡 El bot necesita ser reiniciado manualmente.');
        logger.error('🛑 Saliendo del proceso...');
        
        process.exit(1);
    }
});

/**
 * Evento: Cambio de estado
 */
client.on('change_state', (state) => {
    logger.info(`🔄 Estado cambiado a: ${state}`);
});

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Inicia health checks periódicos
 */
function iniciarHealthChecks() {
    // Limpiar intervalo existente si existe
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
    
    // Health check cada 5 minutos
    healthCheckInterval = setInterval(async () => {
        try {
            const state = await client.getState();
            
            if (state === 'CONNECTED') {
                logger.debug(`💓 Health check OK - Estado: ${state}`);
            } else {
                logger.warn(`⚠️ Health check - Estado anormal: ${state}`);
                
                // Si no está conectado, intentar obtener más información
                if (state === 'TIMEOUT' || state === 'CONFLICT' || state === 'UNPAIRED') {
                    logger.error(`❌ Estado crítico detectado: ${state}`);
                    logger.warn('🔄 El bot podría necesitar reconexión...');
                }
            }
            
            // Log de uso de memoria
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            logger.debug(`💾 Memoria en uso: ${memoryMB} MB`);
            
            // Advertir si el uso de memoria es alto
            if (memoryMB > 500) {
                logger.warn(`⚠️ Alto uso de memoria: ${memoryMB} MB`);
            }
            
        } catch (error) {
            logger.error('❌ Error en health check:', error);
        }
    }, 300000); // 5 minutos
    
    logger.info('💓 Health checks iniciados (cada 5 minutos)');
}

/**
 * Limpieza de recursos antes de cerrar
 */
async function cleanup() {
    logger.info('🧹 Limpiando recursos...');
    
    try {
        // Detener health checks
        if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
            healthCheckInterval = null;
            logger.debug('✅ Health checks detenidos');
        }
        
        // Guardar caché pendiente
        logger.debug('💾 Guardando datos pendientes...');
        // Aquí podrías agregar lógica para guardar datos en caché
        
        // Destruir cliente de WhatsApp
        if (client) {
            logger.info('🛑 Cerrando conexión de WhatsApp...');
            await client.destroy();
            logger.info('✅ Conexión cerrada correctamente');
        }
        
    } catch (error) {
        logger.error('❌ Error durante la limpieza:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// MANEJO DE SEÑALES DEL SISTEMA
// ═══════════════════════════════════════════════════════════════

/**
 * SIGINT: Ctrl+C en la terminal
 */
process.on('SIGINT', async () => {
    logger.info('\n🛑 SIGINT recibido (Ctrl+C). Cerrando bot de forma segura...');
    await cleanup();
    process.exit(0);
});

/**
 * SIGTERM: Señal de terminación del sistema
 */
process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM recibido. Cerrando bot de forma segura...');
    await cleanup();
    process.exit(0);
});

/**
 * Uncaught Exception: Errores no capturados
 */
process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    logger.error('Stack:', error.stack);
    logger.error('🛑 Cerrando bot por error crítico...');
    
    cleanup().then(() => {
        process.exit(1);
    });
});

/**
 * Unhandled Rejection: Promesas rechazadas no manejadas
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection en:', promise);
    logger.error('Razón:', reason);
    
    // No cerramos el proceso, solo logueamos
    // En producción, podrías querer reportar esto a un servicio de monitoreo
});

/**
 * Warning: Node.js warnings
 */
process.on('warning', (warning) => {
    logger.warn('⚠️ Node.js Warning:', warning.name);
    logger.warn('Mensaje:', warning.message);
    logger.warn('Stack:', warning.stack);
});

// ═══════════════════════════════════════════════════════════════
// INFORMACIÓN DE INICIO
// ═══════════════════════════════════════════════════════════════

logger.info('═══════════════════════════════════════════════════════════');
logger.info('🤖 INICIANDO BOT DE WHATSAPP');
logger.info('═══════════════════════════════════════════════════════════');
logger.info(`📅 Fecha: ${new Date().toLocaleString('es-AR')}`);
logger.info(`🖥️  Node.js: ${process.version}`);
logger.info(`💻 Plataforma: ${process.platform}`);
logger.info(`📂 Directorio: ${__dirname}`);
logger.info('═══════════════════════════════════════════════════════════');

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = client;