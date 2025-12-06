"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const cliente_service_1 = __importDefault(require("../services/cliente.service"));
const producto_service_1 = __importDefault(require("../services/producto.service"));
const pedido_service_1 = __importDefault(require("../services/pedido.service"));
const conversaciones = new Map();
class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.initializeClient();
    }
    initializeClient() {
        logger_1.logger.info('Inicializando cliente de WhatsApp...');
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
                dataPath: env_1.env.SESSION_PATH
            }),
            puppeteer: {
                headless: true,
                timeout: 60000,
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
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        if (!this.client)
            return;
        this.client.on('qr', (qr) => {
            logger_1.logger.info('Codigo QR recibido.  Escanea con tu telefono:');
            qrcode_terminal_1.default.generate(qr, { small: true });
        });
        this.client.on('loading_screen', (percent) => {
            logger_1.logger.info('Cargando: ' + percent + '%');
        });
        this.client.on('change_state', (state) => {
            logger_1.logger.info('Estado cambiado a: ' + state);
        });
        this.client.on('ready', () => {
            this.isReady = true;
            logger_1.logger.success('Cliente de WhatsApp listo! ');
        });
        this.client.on('authenticated', () => {
            logger_1.logger.success('WhatsApp autenticado correctamente');
        });
        this.client.on('auth_failure', (msg) => {
            logger_1.logger.error('Error de autenticacion: ' + msg);
        });
        this.client.on('disconnected', (reason) => {
            logger_1.logger.warn('Cliente desconectado: ' + reason);
            this.isReady = false;
        });
        this.client.on('message', async (message) => {
            await this.handleMessage(message);
        });
    }
    async handleMessage(message) {
        try {
            // Ignorar mensajes de grupos y propios
            if (message.from.includes('@g.us') || message.fromMe) {
                return;
            }
            const from = message.from;
            const body = message.body.toLowerCase().trim();
            logger_1.logger.info(`Mensaje de ${from}: ${body}`);
            // Obtener o crear cliente
            await cliente_service_1.default.obtenerOCrear(from);
            // Obtener estado de conversación
            const conversacion = conversaciones.get(from) || { step: 'menu', data: {} };
            // Enrutar según estado
            if (conversacion.step === 'menu') {
                await this.handleMenu(message, body);
            }
            else if (conversacion.step === 'pedido') {
                await this.handlePedido(message, body, conversacion);
            }
            else if (conversacion.step === 'consulta') {
                await this.handleConsulta(message, body);
            }
        }
        catch (error) {
            logger_1.logger.error('Error al manejar mensaje', error);
            await this.sendMessage(message.from, '❌ Ocurrió un error.  Por favor intentá nuevamente.');
        }
    }
    async handleMenu(message, body) {
        const from = message.from;
        // Comandos del menú principal
        if (body.includes('hola') || body.includes('menu') || body.includes('inicio')) {
            const menuText = '👋 *¡Hola!  Bienvenido a BOTSITOT*\n\n' +
                '¿Qué necesitás?\n\n' +
                '1️⃣ 🛒 Hacer un pedido\n' +
                '2️⃣ 💰 Consultar precio\n' +
                '3️⃣ 📋 Ver mis pedidos\n' +
                '4️⃣ 📂 Ver categorías\n' +
                '5️⃣ ℹ️ Información del local\n\n' +
                '_Escribí el número o la palabra clave_';
            await this.sendMessage(from, menuText);
            return;
        }
        // 1. Hacer pedido
        if (body.includes('1') || body.includes('pedido') || body.includes('pedir') || body.includes('comprar')) {
            conversaciones.set(from, {
                step: 'pedido',
                data: { substep: 'nombre', carrito: [] }
            });
            await this.sendMessage(from, '🛒 *NUEVO PEDIDO*\n\n' +
                'Perfecto!  Vamos a armar tu pedido.\n\n' +
                '📝 ¿Cómo te llamás? ');
            return;
        }
        // 2. Consultar precio
        if (body.includes('2') || body.includes('precio') || body.includes('cuanto')) {
            conversaciones.set(from, {
                step: 'consulta',
                data: { tipo: 'precio' }
            });
            await this.sendMessage(from, '💰 *CONSULTA DE PRECIO*\n\n' +
                'Escribí el nombre del producto que querés consultar:');
            return;
        }
        // 3.  Ver mis pedidos
        if (body.includes('3') || body.includes('mis pedidos') || body.includes('historial')) {
            await this.mostrarHistorial(from);
            return;
        }
        // 4. Ver categorías
        if (body.includes('4') || body.includes('categoria')) {
            await this.mostrarCategorias(from);
            return;
        }
        // 5. Información
        if (body.includes('5') || body.includes('info') || body.includes('horario') || body.includes('ubicacion')) {
            await this.mostrarInformacion(from);
            return;
        }
        // Si no coincide con nada, mostrar menú
        await this.sendMessage(from, '❓ No entendí tu mensaje.\n\n' +
            'Escribí *menu* para ver las opciones disponibles.');
    }
    async handlePedido(message, body, conversacion) {
        const from = message.from;
        const { substep, carrito, nombre, productos } = conversacion.data;
        // Cancelar pedido
        if (body.includes('cancelar') || body.includes('salir')) {
            conversaciones.delete(from);
            await this.sendMessage(from, '❌ Pedido cancelado.\n\nEscribí *menu* para volver al inicio.');
            return;
        }
        // 1. Pedir nombre
        if (substep === 'nombre') {
            conversacion.data.nombre = message.body.trim();
            conversacion.data.substep = 'buscar';
            conversaciones.set(from, conversacion);
            await cliente_service_1.default.actualizarNombre(from, conversacion.data.nombre);
            await this.sendMessage(from, `Perfecto ${conversacion.data.nombre}!  👍\n\n` +
                '🔍 *¿Qué producto buscás?*\n\n' +
                'Escribí el nombre o escribí *categorias* para ver todas.');
            return;
        }
        // 2.  Buscar productos
        if (substep === 'buscar') {
            if (body === 'categorias') {
                await this.mostrarCategorias(from);
                return;
            }
            // Verificar si es una categoría
            const categorias = ['VARIOS', 'HIGIENE', 'ACCESORIO_CELULAR', 'JUGUETERIA', 'IMPRESIONES', 'LIBRERIA'];
            const bodyUpper = body.toUpperCase().replace(/ /g, '_');
            const categoriaSeleccionada = categorias.find(cat => bodyUpper === cat ||
                bodyUpper === cat.replace(/_/g, ' ') ||
                body === String(categorias.indexOf(cat) + 1));
            let productosEncontrados;
            if (categoriaSeleccionada) {
                // Buscar por categoría
                productosEncontrados = await producto_service_1.default.obtenerPorCategoria(categoriaSeleccionada);
            }
            else {
                // Buscar por texto
                productosEncontrados = await producto_service_1.default.buscar(body);
            }
            if (productosEncontrados.length === 0) {
                await this.sendMessage(from, '❌ No encontré productos.\n\n' +
                    'Probá con otro término o escribí *categorias*');
                return;
            }
            conversacion.data.productos = productosEncontrados;
            conversacion.data.substep = 'seleccionar';
            conversaciones.set(from, conversacion);
            let mensaje = `🎯 *Encontré ${productosEncontrados.length} productos:*\n\n`;
            productosEncontrados.slice(0, 10).forEach((prod, index) => {
                mensaje += `${index + 1}. *${prod.nombre}*\n`;
                mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
                if (prod.unidad)
                    mensaje += ` ${prod.unidad}`;
                mensaje += `\n\n`;
            });
            mensaje += '📝 Para agregar escribí:\n';
            mensaje += '*agregar [número] [cantidad]*\n';
            mensaje += 'Ejemplo: agregar 1 2';
            await this.sendMessage(from, mensaje);
            return;
        }
        // 3.  Agregar productos
        if (substep === 'seleccionar') {
            if (body.startsWith('agregar')) {
                const partes = body.split(' ');
                if (partes.length < 3) {
                    await this.sendMessage(from, '❌ Formato incorrecto.\n\n' +
                        'Usá: *agregar [número] [cantidad]*\n' +
                        'Ejemplo: agregar 1 2');
                    return;
                }
                const numeroProducto = parseInt(partes[1]) - 1;
                const cantidad = parseInt(partes[2]);
                if (isNaN(numeroProducto) || isNaN(cantidad) || cantidad < 1) {
                    await this.sendMessage(from, '❌ Número o cantidad inválidos.');
                    return;
                }
                const producto = productos[numeroProducto];
                if (!producto) {
                    await this.sendMessage(from, '❌ Número de producto inválido.');
                    return;
                }
                // Agregar al carrito
                carrito.push({
                    productoId: producto.id,
                    nombre: producto.nombre,
                    precio: Number(producto.precio),
                    cantidad
                });
                conversacion.data.carrito = carrito;
                conversaciones.set(from, conversacion);
                const subtotal = Number(producto.precio) * cantidad;
                await this.sendMessage(from, `✅ Agregado al carrito:\n\n` +
                    `📦 ${producto.nombre} x${cantidad}\n` +
                    `💰 $${subtotal.toLocaleString('es-AR')}\n\n` +
                    `Podés:\n` +
                    `➕ Seguir buscando productos\n` +
                    `🛒 Escribir *ver carrito*\n` +
                    `✅ Escribir *confirmar* para finalizar`);
                return;
            }
            if (body.includes('ver carrito') || body.includes('carrito')) {
                await this.mostrarCarrito(from, carrito);
                return;
            }
            if (body.includes('confirmar')) {
                if (carrito.length === 0) {
                    await this.sendMessage(from, '❌ Tu carrito está vacío.');
                    return;
                }
                conversacion.data.substep = 'entrega';
                conversaciones.set(from, conversacion);
                await this.sendMessage(from, '📍 *TIPO DE ENTREGA*\n\n' +
                    '1️⃣ 🚚 Delivery (+$500)\n' +
                    '2️⃣ 🏪 Retiro en local (Gratis)\n\n' +
                    'Escribí 1 o 2:');
                return;
            }
            // Si no es ningún comando, buscar otro producto
            conversacion.data.substep = 'buscar';
            conversaciones.set(from, conversacion);
            await this.handlePedido(message, body, conversacion);
            return;
        }
        // 4.  Tipo de entrega y confirmación
        if (substep === 'entrega') {
            const tipoEntrega = body === '1' ? 'DELIVERY' : 'RETIRO';
            try {
                const items = carrito.map((item) => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad
                }));
                const pedido = await pedido_service_1.default.crear({
                    clienteTelefono: from,
                    items,
                    tipoEntrega
                });
                const resumen = await pedido_service_1.default.obtenerResumen(pedido.id);
                // Limpiar conversación
                conversaciones.delete(from);
                await this.sendMessage(from, '✅ *PEDIDO CONFIRMADO*\n\n' +
                    resumen +
                    '\n\n' +
                    '📞 Te contactaremos para coordinar la entrega.\n' +
                    '¡Gracias por tu compra!  🎉\n\n' +
                    'Escribí *menu* para volver al inicio.');
            }
            catch (error) {
                await this.sendMessage(from, '❌ Error al crear el pedido:\n' +
                    error.message +
                    '\n\nIntentá nuevamente.');
                conversaciones.delete(from);
            }
            return;
        }
    }
    async handleConsulta(message, body) {
        const from = message.from;
        // Verificar si es una categoría
        const categorias = ['VARIOS', 'HIGIENE', 'ACCESORIO_CELULAR', 'JUGUETERIA', 'IMPRESIONES', 'LIBRERIA'];
        const bodyUpper = body.toUpperCase().replace(/ /g, '_');
        const categoriaSeleccionada = categorias.find(cat => bodyUpper === cat ||
            bodyUpper === cat.replace(/_/g, ' '));
        let productos;
        if (categoriaSeleccionada) {
            productos = await producto_service_1.default.obtenerPorCategoria(categoriaSeleccionada);
        }
        else {
            productos = await producto_service_1.default.buscar(body);
        }
        conversaciones.delete(from);
        if (productos.length === 0) {
            await this.sendMessage(from, '❌ No encontré ese producto.\n\n' +
                'Probá con otro nombre o escribí *menu*');
            return;
        }
        let mensaje = `🔍 Resultados para "${body}":\n\n`;
        productos.slice(0, 5).forEach((prod) => {
            mensaje += `📦 *${prod.nombre}*\n`;
            mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
            if (prod.unidad)
                mensaje += ` ${prod.unidad}`;
            mensaje += `\n`;
            mensaje += `   📂 ${prod.categoria.replace(/_/g, ' ')}\n`;
            mensaje += `   ${prod.stock ? '✅ En stock' : '❌ Sin stock'}\n\n`;
        });
        mensaje += '¿Querés hacer un pedido?  Escribí *pedido*';
        await this.sendMessage(from, mensaje);
    }
    async mostrarCarrito(from, carrito) {
        if (carrito.length === 0) {
            await this.sendMessage(from, '🛒 Tu carrito está vacío.');
            return;
        }
        let mensaje = '🛒 *TU CARRITO:*\n\n';
        let total = 0;
        carrito.forEach((item, index) => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;
            mensaje += `${index + 1}.  ${item.nombre} x${item.cantidad}\n`;
            mensaje += `   $${subtotal.toLocaleString('es-AR')}\n\n`;
        });
        mensaje += `💰 *TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
        mensaje += `✅ *confirmar* para finalizar\n`;
        mensaje += `🗑️ *cancelar* para vaciar`;
        await this.sendMessage(from, mensaje);
    }
    async mostrarHistorial(from) {
        const pedidos = await cliente_service_1.default.obtenerHistorialPedidos(from, 5);
        if (pedidos.length === 0) {
            await this.sendMessage(from, '📋 Todavía no tenés pedidos realizados.\n\n' +
                'Escribí *pedido* para hacer tu primera compra!  🛒');
            return;
        }
        let mensaje = '📋 *TUS ÚLTIMOS PEDIDOS:*\n\n';
        pedidos.forEach((pedido) => {
            mensaje += `🔹 *${pedido.numero}*\n`;
            mensaje += `   📅 ${new Date(pedido.fecha).toLocaleDateString('es-AR')}\n`;
            mensaje += `   💰 $${Number(pedido.total).toLocaleString('es-AR')}\n`;
            mensaje += `   📍 ${pedido.tipoEntrega === 'DELIVERY' ? 'Delivery' : 'Retiro'}\n`;
            mensaje += `   ${pedido.estado === 'ENTREGADO' ? '✅' : '⏳'} ${pedido.estado}\n\n`;
        });
        await this.sendMessage(from, mensaje);
    }
    async mostrarCategorias(from) {
        const categorias = await producto_service_1.default.obtenerCategorias();
        let mensaje = '📂 *CATEGORÍAS DISPONIBLES*\n\n';
        categorias.forEach((cat, index) => {
            mensaje += `${index + 1}️⃣ ${cat.replace(/_/g, ' ')}\n`;
        });
        mensaje += '\nEscribí el nombre de una categoría o buscá un producto. ';
        await this.sendMessage(from, mensaje);
    }
    async mostrarInformacion(from) {
        const mensaje = '🏪 *INFORMACIÓN DEL LOCAL*\n\n' +
            '📍 Dirección: [Tu dirección aquí]\n' +
            '🕐 Horarios:\n' +
            '   Lunes a Viernes: 9:00 - 19:00\n' +
            '   Sábados: 9:00 - 13:00\n' +
            '   Domingos: Cerrado\n\n' +
            '💳 *MEDIOS DE PAGO:*\n' +
            '✅ Efectivo\n' +
            '✅ Transferencia\n' +
            '✅ Mercado Pago\n' +
            '✅ Tarjetas\n\n' +
            '📞 También podés hacer pedidos por este chat 24/7';
        await this.sendMessage(from, mensaje);
    }
    async initialize() {
        if (!this.client) {
            throw new Error('Cliente no inicializado');
        }
        logger_1.logger.info('Iniciando cliente de WhatsApp...');
        await this.client.initialize();
    }
    async sendMessage(to, message) {
        if (!this.client || !this.isReady) {
            throw new Error('Cliente no esta listo');
        }
        try {
            await this.client.sendMessage(to, message);
            logger_1.logger.info('Mensaje enviado a ' + to);
        }
        catch (error) {
            logger_1.logger.error('Error al enviar mensaje', error);
            throw error;
        }
    }
    async sendMediaMessage(to, mediaPath, caption) {
        if (!this.client || !this.isReady) {
            throw new Error('Cliente no esta listo');
        }
        try {
            const { MessageMedia } = await Promise.resolve().then(() => __importStar(require('whatsapp-web.js')));
            const media = MessageMedia.fromFilePath(mediaPath);
            await this.client.sendMessage(to, media, { caption });
            logger_1.logger.info('Mensaje con media enviado a ' + to);
        }
        catch (error) {
            logger_1.logger.error('Error al enviar mensaje con media', error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    isClientReady() {
        return this.isReady;
    }
}
exports.whatsappService = new WhatsAppService();
//# sourceMappingURL=whatsapp.service.js.map