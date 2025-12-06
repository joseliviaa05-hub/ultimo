// src/routes/dashboard.routes.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 DASHBOARD ROUTES - Rutas del dashboard (legacy + nuevas)
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const cache = require('../utils/CacheManager');
const aiService = require('../services/aiService');
const logger = require('../middlewares/logger');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════
// ESTADO DEL BOT
// ═══════════════════════════════════════════════════════════
router.get('/estado', (req, res) => {
    try {
        const negocio = cache.obtenerNegocioSync();
        
        res.json({
            success: true,
            activo: true,
            conectado: true,
            numero: negocio.whatsapp || null,
            notificaciones: negocio.notificaciones_activas,
            respuestas_automaticas: negocio.respuestas_automaticas_activas,
            respuestas_activas: negocio.respuestas_automaticas_activas,
            ia_activa: aiService.estaActivo()
        });
    } catch (error) {
        logger.error('❌ Error obteniendo estado:', error);
        res.status(500).json({ error: 'Error al obtener estado' });
    }
});

// ═══════════════════════════════════════════════════════════
// TOGGLE RESPUESTAS AUTOMÁTICAS
// ═══════════════════════════════════════════════════════════
router.post('/toggle-respuestas', (req, res) => {
    try {
        const negocio = cache.obtenerNegocioSync();
        negocio.respuestas_automaticas_activas = !negocio.respuestas_automaticas_activas;
        
        const negocioPath = path.join(__dirname, '../../data/negocio.json');
        fs.writeFileSync(negocioPath, JSON.stringify(negocio, null, 2));
        cache.invalidarNegocio();
        
        logger.info(`🔄 Respuestas automáticas ${negocio.respuestas_automaticas_activas ? 'ACTIVADAS' : 'PAUSADAS'} desde el dashboard`);
        
        res.json({
            success: true,
            estado: negocio.respuestas_automaticas_activas
        });
    } catch (error) {
        logger.error('❌ Error al cambiar estado:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
});

// ═══════════════════════════════════════════════════════════
// RESPUESTAS DEL BOT
// ═══════════════════════════════════════════════════════════
router.get('/respuestas', (req, res) => {
    try {
        const respuestasBot = cache.obtenerRespuestasBotSync();
        
        const respuestasApp = {
            bienvenida: respuestasBot.saludos?.bienvenida || '',
            catalogo_enviado: respuestasBot.consultas?.lista_categorias || '',
            producto_no_disponible: respuestasBot.pedidos?.sin_stock || '',
            confirmacion_pedido: respuestasBot.pedidos?.productos_encontrados || '',
            pedido_confirmado: respuestasBot.pedidos?.pedido_confirmado || '',
            despedida: respuestasBot.saludos?.despedida || '',
            fuera_horario: respuestasBot.comandos_dueño?.bot_pausado || '🕐 Actualmente estamos fuera del horario de atención.',
        };
        
        logger.info('✅ GET /api/respuestas - Respuestas enviadas');
        res.json(respuestasApp);
    } catch (error) {
        logger.error('❌ Error al cargar respuestas:', error);
        res.status(500).json({ error: 'Error al cargar respuestas' });
    }
});

router.put('/respuestas', (req, res) => {
    try {
        const {
            bienvenida,
            catalogo_enviado,
            producto_no_disponible,
            confirmacion_pedido,
            pedido_confirmado,
            despedida,
            fuera_horario,
        } = req.body;

        if (!bienvenida || !catalogo_enviado || !producto_no_disponible || 
            !confirmacion_pedido || !pedido_confirmado || !despedida || !fuera_horario) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        logger.info('📝 Actualizando respuestas del bot...');

        const respuestasBot = cache.obtenerRespuestasBotSync();

        if (respuestasBot.saludos) {
            respuestasBot.saludos.bienvenida = bienvenida.trim();
            respuestasBot.saludos.despedida = despedida.trim();
        }

        if (respuestasBot.consultas) {
            respuestasBot.consultas.lista_categorias = catalogo_enviado.trim();
        }

        if (respuestasBot.pedidos) {
            respuestasBot.pedidos.sin_stock = producto_no_disponible.trim();
            respuestasBot.pedidos.productos_encontrados = confirmacion_pedido.trim();
            respuestasBot.pedidos.pedido_confirmado = pedido_confirmado.trim();
        }
        
        if (respuestasBot.comandos_dueño) {
            respuestasBot.comandos_dueño.bot_pausado = fuera_horario.trim();
        }

        const respuestasPath = path.join(__dirname, '../../data/respuestas-bot.json');
        fs.writeFileSync(respuestasPath, JSON.stringify(respuestasBot, null, 2));
        cache.invalidarRespuestasBot();

        logger.info('✅ Respuestas actualizadas exitosamente');
        
        res.json({ 
            success: true, 
            mensaje: 'Respuestas actualizadas exitosamente'
        });
    } catch (error) {
        logger.error('❌ Error al actualizar respuestas:', error);
        res.status(500).json({ error: 'Error al actualizar respuestas', detalle: error.message });
    }
});

router.post('/respuestas/restaurar', (req, res) => {
    try {
        const respuestasDefault = {
            "saludos": {
                "bienvenida": "¡Hola{cliente_frecuente}! 👋 Bienvenido a *{nombre_negocio}*\n\n{info_cliente}Te puedo ayudar con:\n📋 Lista de precios\n🕐 Horarios\n📍 Ubicación\n📦 Stock\n💳 Medios de pago",
                "despedida": "🙏 ¡Gracias por tu preferencia!\n\n¿Deseas hacer un nuevo pedido? 🛒"
            },
            "consultas": {
                "horarios": "🕐 *Horarios de Atención*\n\n{horarios}",
                "ubicacion": "📍 *Nuestra Ubicación*\n\n{direccion}\n\nTe esperamos! 😊",
                "medios_pago": "💳 *Medios de Pago:*\n\n{medios_pago}",
                "contacto": "📞 *Contacto*\n\nWhatsApp: {whatsapp}\nTeléfono: {telefono}\n\n¡Estamos para ayudarte! 😊",
                "stock": "📦 Para consultar stock específico, escribe el nombre del producto.\n\nEjemplo: \"Hay cuadernos A4?\"",
                "lista_categorias": "📋 *Categorías Disponibles:*\n\nEscribe el nombre de la categoría para ver productos"
            },
            "pedidos": {
                "carrito_vacio": "🛒 Tu carrito está vacío\n\nPara hacer un pedido, escribe por ejemplo:\n\"Quiero 2 cuadernos\" o \"Dame 5 lapiceras\"",
                "productos_encontrados": "🔍 *Encontré estos productos:*\n\n{lista_productos}\n\n¿Es correcto este pedido?\n\n• Escribe *\"si\"* para agregarlo al carrito\n• Escribe *\"no\"* para cancelar",
                "productos_agregados": "✅ Productos agregados al carrito\n\n💡 ¿Deseas agregar más productos?\n• Escribe otro pedido (ej: \"3 lapiceras\")\n• O escribe *\"confirmar\"* para finalizar",
                "pedido_confirmado": "✅ *PEDIDO CONFIRMADO*\n\n📄 Número de pedido: *#{numero_pedido}*\n\n🙏 ¡Gracias por tu compra!",
                "carrito_cancelado": "✅ Carrito vaciado correctamente\n\nPara hacer un nuevo pedido, escribe por ejemplo:\n\"Quiero 2 cuadernos\"",
                "sin_stock": "❌ No puedo agregar estos productos porque están SIN STOCK:\n\n{productos_sin_stock}\n\n¿Deseas continuar solo con los productos disponibles? (si/no)"
            },
            "errores": {
                "no_entiendo": "No entendí bien tu consulta 🤔\n\nPuedes preguntarme sobre:\n• Precios y productos\n• Hacer un pedido (ej: \"Quiero 2 cuadernos\")\n• Ver mis pedidos anteriores\n• Horarios y ubicación",
                "sin_productos_carrito": "❌ No tienes productos en el carrito.\n\nPara hacer un pedido, escribe por ejemplo:\n\"Quiero 2 cuadernos\"",
                "numero_invalido": "❌ Número de producto inválido",
                "opcion_invalida": "❌ Opción no válida.\n\nResponde *\"1\"* para retiro o *\"2\"* para delivery"
            },
            "comandos_dueño": {
                "bot_pausado": "⏸️ *RESPUESTAS AUTOMÁTICAS PAUSADAS*\n\nEl bot NO responderá a los clientes.\nTú puedes seguir controlándolo.\n\nPara reanudar: \"reanudar bot\"",
                "bot_reactivado": "▶️ *RESPUESTAS AUTOMÁTICAS REACTIVADAS*\n\nEl bot volverá a responder a los clientes automáticamente.\n\nPara pausar: \"pausar bot\"",
                "notificaciones_activadas": "✅ *Notificaciones ACTIVADAS*\n\nRecibirás un mensaje automático cada vez que un cliente confirme un pedido.\n\nPara desactivar: \"desactivar notificaciones\"",
                "notificaciones_desactivadas": "🔕 *Notificaciones DESACTIVADAS*\n\nYa no recibirás mensajes automáticos de nuevos pedidos.\n\nPara activar: \"activar notificaciones\""
            }
        };
        
        const respuestasPath = path.join(__dirname, '../../data/respuestas-bot.json');
        fs.writeFileSync(respuestasPath, JSON.stringify(respuestasDefault, null, 2));
        cache.invalidarRespuestasBot();
        
        logger.info('✅ Respuestas restauradas a valores por defecto');
        
        res.json({ 
            success: true, 
            mensaje: 'Respuestas restauradas exitosamente',
            respuestas: respuestasDefault
        });
    } catch (error) {
        logger.error('❌ Error al restaurar respuestas:', error);
        res.status(500).json({ error: 'Error al restaurar respuestas' });
    }
});

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL NEGOCIO
// ═══════════════════════════════════════════════════════════
router.get('/configuracion', (req, res) => {
    try {
        const negocio = cache.obtenerNegocioSync();
        res.json(negocio);
    } catch (error) {
        logger.error('❌ Error al cargar configuración:', error);
        res.status(500).json({ error: 'Error al cargar configuración', detalle: error.message });
    }
});

router.put('/configuracion', (req, res) => {
    try {
        const nuevaConfiguracion = req.body;
        
        logger.info('🏪 Actualizando configuración del negocio...');
        
        if (!nuevaConfiguracion.nombre || !nuevaConfiguracion.whatsapp) {
            return res.status(400).json({ error: 'Nombre y WhatsApp son requeridos' });
        }
        
        const configuracionActual = cache.obtenerNegocioSync();
        
        const configuracionActualizada = {
            ...nuevaConfiguracion,
            respuestas_automaticas_activas: configuracionActual.respuestas_automaticas_activas,
            notificaciones_activas: configuracionActual.notificaciones_activas
        };
        
        const negocioPath = path.join(__dirname, '../../data/negocio.json');
        fs.writeFileSync(negocioPath, JSON.stringify(configuracionActualizada, null, 2));
        cache.invalidarNegocio();
        
        logger.info('✅ Configuración actualizada exitosamente');
        
        res.json({ 
            success: true, 
            mensaje: 'Configuración actualizada exitosamente'
        });
    } catch (error) {
        logger.error('❌ Error al actualizar configuración:', error);
        res.status(500).json({ error: 'Error al actualizar configuración', detalle: error.message });
    }
});

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PEDIDOS
// ═══════════════════════════════════════════════════════════
router.get('/configuracion/pedidos', (req, res) => {
    try {
        const configPedidos = cache.obtenerConfigPedidosSync();
        res.json(configPedidos);
    } catch (error) {
        logger.error('❌ Error al cargar configuración de pedidos:', error);
        res.status(500).json({ error: 'Error al cargar configuración de pedidos' });
    }
});

router.put('/configuracion/pedidos', (req, res) => {
    try {
        const nuevaConfiguracion = req.body;
        
        logger.info('📦 Actualizando configuración de pedidos...');
        
        const configPath = path.join(__dirname, '../../data/config-pedidos.json');
        fs.writeFileSync(configPath, JSON.stringify(nuevaConfiguracion, null, 2));
        cache.invalidarConfigPedidos();
        
        logger.info('✅ Configuración de pedidos actualizada');
        
        res.json({ 
            success: true, 
            mensaje: 'Configuración de pedidos actualizada exitosamente'
        });
    } catch (error) {
        logger.error('❌ Error al actualizar configuración de pedidos:', error);
        res.status(500).json({ error: 'Error al actualizar configuración de pedidos' });
    }
});

// ═══════════════════════════════════════════════════════════
// PALABRAS CLAVE
// ═══════════════════════════════════════════════════════════
router.get('/configuracion/palabras-clave', (req, res) => {
    try {
        const palabrasPath = path.join(__dirname, '../../data/palabras-clave.json');
        const palabrasClave = JSON.parse(fs.readFileSync(palabrasPath, 'utf8'));
        res.json(palabrasClave);
    } catch (error) {
        logger.error('❌ Error al cargar palabras clave:', error);
        res.status(500).json({ error: 'Error al cargar palabras clave' });
    }
});

router.put('/configuracion/palabras-clave', (req, res) => {
    try {
        const nuevasPalabras = req.body;
        
        logger.info('🔑 Actualizando palabras clave...');
        
        const palabrasPath = path.join(__dirname, '../../data/palabras-clave.json');
        fs.writeFileSync(palabrasPath, JSON.stringify(nuevasPalabras, null, 2));
        
        logger.info('✅ Palabras clave actualizadas');
        
        res.json({ 
            success: true, 
            mensaje: 'Palabras clave actualizadas exitosamente'
        });
    } catch (error) {
        logger.error('❌ Error al actualizar palabras clave:', error);
        res.status(500).json({ error: 'Error al actualizar palabras clave' });
    }
});

// ═══════════════════════════════════════════════════════════
// DESCUENTOS
// ═══════════════════════════════════════════════════════════
router.get('/descuentos', (req, res) => {
    try {
        const configPedidos = cache.obtenerConfigPedidosSync();
        logger.info('✅ GET /api/descuentos - Configuración enviada');
        res.json(configPedidos.descuentos);
    } catch (error) {
        logger.error('❌ Error al cargar descuentos:', error);
        res.status(500).json({ error: 'Error al cargar descuentos' });
    }
});

router.put('/descuentos', (req, res) => {
    try {
        const { habilitado, reglas } = req.body;

        logger.info('💰 Actualizando configuración de descuentos...');

        if (!Array.isArray(reglas)) {
            return res.status(400).json({ error: 'Las reglas deben ser un array' });
        }

        for (const regla of reglas) {
            if (!regla.minimo || !regla.porcentaje || !regla.descripcion) {
                return res.status(400).json({ 
                    error: 'Cada regla debe tener: minimo, porcentaje y descripcion' 
                });
            }

            if (regla.minimo <= 0) {
                return res.status(400).json({ 
                    error: 'El monto mínimo debe ser mayor a 0' 
                });
            }

            if (regla.porcentaje <= 0 || regla.porcentaje > 100) {
                return res.status(400).json({ 
                    error: 'El porcentaje debe estar entre 1 y 100' 
                });
            }
        }

        const configPedidos = cache.obtenerConfigPedidosSync();

        configPedidos.descuentos = {
            habilitado: habilitado !== false,
            reglas: reglas.map(r => ({
                minimo: parseFloat(r.minimo),
                porcentaje: parseFloat(r.porcentaje),
                descripcion: r.descripcion.trim()
            }))
        };

        const configPath = path.join(__dirname, '../../data/config-pedidos.json');
        fs.writeFileSync(configPath, JSON.stringify(configPedidos, null, 2));
        cache.invalidarConfigPedidos();

        logger.info('✅ Descuentos actualizados exitosamente');

        res.json({
            success: true,
            mensaje: 'Descuentos actualizados exitosamente',
            descuentos: configPedidos.descuentos
        });

    } catch (error) {
        logger.error('❌ Error al actualizar descuentos:', error);
        res.status(500).json({ error: 'Error al actualizar descuentos', detalle: error.message });
    }
});

router.post('/descuentos/toggle', (req, res) => {
    try {
        const configPedidos = cache.obtenerConfigPedidosSync();

        configPedidos.descuentos.habilitado = !configPedidos.descuentos.habilitado;

        const configPath = path.join(__dirname, '../../data/config-pedidos.json');
        fs.writeFileSync(configPath, JSON.stringify(configPedidos, null, 2));
        cache.invalidarConfigPedidos();

        const estado = configPedidos.descuentos.habilitado ? 'ACTIVADOS' : 'DESACTIVADOS';
        logger.info(`🔄 Descuentos ${estado}`);

        res.json({
            success: true,
            habilitado: configPedidos.descuentos.habilitado,
            mensaje: `Descuentos ${estado.toLowerCase()}`
        });

    } catch (error) {
        logger.error('❌ Error al cambiar estado de descuentos:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
});

// ═══════════════════════════════════════════════════════════
// ESTADÍSTICAS DEL DASHBOARD
// ═══════════════════════════════════════════════════════════
router.get('/estadisticas', (req, res) => {
    try {
        const clientesData = cache.obtenerClientesSync();
        const pedidosData = cache.obtenerPedidosSync();
        
        logger.info('📊 GET /api/estadisticas solicitado');
        
        // Estadísticas generales
        const stats = {
            total_clientes: clientesData.estadisticas?.total_clientes || 0,
            total_pedidos: clientesData.estadisticas?.total_pedidos || 0,
            total_vendido: clientesData.estadisticas?.total_vendido || 0
        };
        
        // Último pedido
        let ultimoPedido = null;
        if (pedidosData.pedidos && pedidosData.pedidos.length > 0) {
            const pedido = pedidosData.pedidos[pedidosData.pedidos.length - 1];
            ultimoPedido = {
                id: pedido.id,
                nombre: pedido.nombre,
                total: pedido.total,
                fecha: pedido.fecha
            };
        }
        
        // Pedidos de los últimos 7 días
        const pedidosPorDia = [];
        if (pedidosData.pedidos && pedidosData.pedidos.length > 0) {
            const ahora = new Date();
            const hace7Dias = new Date(ahora.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            // Agrupar pedidos por día
            const pedidosRecientes = pedidosData.pedidos.filter(p => {
                const fechaPedido = new Date(p.fecha);
                return fechaPedido >= hace7Dias;
            });
            
            // Crear objeto con fechas de los últimos 7 días
            const diasMap = {};
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date(ahora.getTime() - (i * 24 * 60 * 60 * 1000));
                const fechaStr = fecha.toLocaleDateString('es-AR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                });
                diasMap[fechaStr] = { fecha: fechaStr, ventas: 0, pedidos: 0 };
            }
            
            // Contar pedidos y ventas por día
            pedidosRecientes.forEach(pedido => {
                const fechaPedido = new Date(pedido.fecha);
                const fechaStr = fechaPedido.toLocaleDateString('es-AR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                });
                
                if (diasMap[fechaStr]) {
                    diasMap[fechaStr].pedidos += 1;
                    diasMap[fechaStr].ventas += pedido.total || 0;
                }
            });
            
            // Convertir a array
            pedidosPorDia.push(...Object.values(diasMap));
        }
        
        const response = {
            ...stats,
            ultimo_pedido: ultimoPedido,
            pedidos_por_dia: pedidosPorDia
        };
        
        logger.info('✅ Estadísticas enviadas:', response);
        
        res.json(response);
    } catch (error) {
        logger.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas',
            total_clientes: 0,
            total_pedidos: 0,
            total_vendido: 0,
            pedidos_por_dia: [],
            ultimo_pedido: null
        });
    }
});

module.exports = router;