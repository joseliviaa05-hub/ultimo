import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import clienteService from '../services/cliente.service';
import productoService from '../services/producto.service';
import pedidoService from '../services/pedido.service';

// Estado temporal de conversaciones
interface ConversacionState {
  step: string;
  data: any;
}

const conversaciones = new Map<string, ConversacionState>();

class WhatsAppService {
  private client: Client | null = null;
  private isReady: boolean = false;

  constructor() {
    this. initializeClient();
  }

  private initializeClient(): void {
    logger.info('Inicializando cliente de WhatsApp...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: env.SESSION_PATH
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

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      logger.info('Codigo QR recibido.  Escanea con tu telefono:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('loading_screen', (percent: number) => {
      logger.info('Cargando: ' + percent + '%');
    });

    this.client.on('change_state', (state: string) => {
      logger.info('Estado cambiado a: ' + state);
    });

    this.client.on('ready', () => {
      this.isReady = true;
      logger.success('Cliente de WhatsApp listo! ');
    });

    this. client.on('authenticated', () => {
      logger. success('WhatsApp autenticado correctamente');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('Error de autenticacion: ' + msg);
    });

    this.client.on('disconnected', (reason) => {
      logger. warn('Cliente desconectado: ' + reason);
      this.isReady = false;
    });

    this.client.on('message', async (message: Message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      // Ignorar mensajes de grupos y propios
      if (message.from. includes('@g.us') || message. fromMe) {
        return;
      }

      const from = message.from;
      const body = message.body. toLowerCase(). trim();

      // WHITELIST: Verificar si el número está autorizado
      const numeroLimpio = from.replace(/\D/g, ''); // Quitar todo excepto números
      const estaAutorizado = env. WHATSAPP_WHITELIST. length === 0 || 
                            env.WHATSAPP_WHITELIST.some(numero => 
                              numeroLimpio.includes(numero) || numero. includes(numeroLimpio)
                            );

      if (!estaAutorizado) {
        logger.warn(`Mensaje ignorado de numero NO autorizado: ${from}`);
        return;
      }

      logger.info(`Mensaje de ${from} (AUTORIZADO): ${body}`);

      // Obtener o crear cliente
      await clienteService.obtenerOCrear(from);

      // Obtener estado de conversación
      const conversacion = conversaciones.get(from) || { step: 'menu', data: {} };

      // Enrutar según estado
      if (conversacion.step === 'menu') {
        await this. handleMenu(message, body);
      } else if (conversacion.step === 'pedido') {
        await this.handlePedido(message, body, conversacion);
      } else if (conversacion.step === 'consulta') {
        await this. handleConsulta(message, body);
      }

    } catch (error) {
      logger.error('Error al manejar mensaje', error as Error);
      await this.sendMessage(
        message.from,
        '❌ Ocurrio un error.  Por favor intenta nuevamente.'
      );
    }
  }

  private async handleMenu(message: Message, body: string): Promise<void> {
    const from = message.from;

    // Comandos del menú principal
    if (body. includes('hola') || body.includes('menu') || body.includes('inicio')) {
      const menuText = 
        '👋 *¡Hola! Bienvenido a BOTSITOT*\n\n' +
        '¿Que necesitas?\n\n' +
        '1️⃣ 🛒 Hacer un pedido\n' +
        '2️⃣ 💰 Consultar precio\n' +
        '3️⃣ 📋 Ver mis pedidos\n' +
        '4️⃣ 📂 Ver categorias\n' +
        '5️⃣ ℹ️ Informacion del local\n\n' +
        '_Escribi el numero o la palabra clave_';
      
      await this.sendMessage(from, menuText);
      return;
    }

    // 1.  Hacer pedido
    if (body.includes('1') || body.includes('pedido') || body.includes('pedir') || body.includes('comprar')) {
      conversaciones.set(from, { 
        step: 'pedido', 
        data: { substep: 'nombre', carrito: [] } 
      });
      
      await this.sendMessage(
        from,
        '🛒 *NUEVO PEDIDO*\n\n' +
        'Perfecto!  Vamos a armar tu pedido.\n\n' +
        '📝 ¿Como te llamas? '
      );
      return;
    }

    // 2.  Consultar precio
    if (body.includes('2') || body.includes('precio') || body.includes('cuanto')) {
      conversaciones.set(from, { 
        step: 'consulta', 
        data: { tipo: 'precio' } 
      });
      
      await this.sendMessage(
        from,
        '💰 *CONSULTA DE PRECIO*\n\n' +
        'Escribi el nombre del producto que queres consultar:'
      );
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
      await this. mostrarInformacion(from);
      return;
    }

    // Si no coincide con nada, mostrar menú
    await this.sendMessage(
      from,
      '❓ No entendi tu mensaje.\n\n' +
      'Escribi *menu* para ver las opciones disponibles.'
    );
  }

  private async handlePedido(message: Message, body: string, conversacion: ConversacionState): Promise<void> {
    const from = message. from;
    const { substep, carrito, nombre, productos } = conversacion.data;

    // Cancelar pedido
    if (body.includes('cancelar') || body.includes('salir')) {
      conversaciones.delete(from);
      await this.sendMessage(from, '❌ Pedido cancelado.\n\nEscribi *menu* para volver al inicio.');
      return;
    }

    // 1. Pedir nombre
    if (substep === 'nombre') {
      conversacion.data.nombre = message.body. trim();
      conversacion.data.substep = 'buscar';
      conversaciones.set(from, conversacion);

      await clienteService.actualizarNombre(from, conversacion.data.nombre);

      await this.sendMessage(
        from,
        `Perfecto ${conversacion.data.nombre}!  👍\n\n` +
        '🔍 *¿Que producto buscas?*\n\n' +
        'Escribi el nombre o escribi *categorias* para ver todas.'
      );
      return;
    }

    // 2.  Buscar productos (DINAMICO desde BD)
    if (substep === 'buscar') {
      if (body === 'categorias') {
        await this.mostrarCategorias(from);
        return;
      }

      // Obtener categorías dinámicamente desde la BD
      const categoriasDisponibles = await productoService. obtenerCategorias();
      const bodyUpper = body.toUpperCase(). replace(/ /g, '_');
      
      const categoriaSeleccionada = categoriasDisponibles.find((cat, index) => {
        const catUpper = cat.toUpperCase();
        return bodyUpper === catUpper || 
               bodyUpper === catUpper.replace(/_/g, ' ') ||
               body === String(index + 1);
      });

      let productosEncontrados;

      if (categoriaSeleccionada) {
        // Buscar por categoría
        productosEncontrados = await productoService.obtenerPorCategoria(categoriaSeleccionada);
      } else {
        // Buscar por texto
        productosEncontrados = await productoService.buscar(body);
      }

      if (productosEncontrados. length === 0) {
        await this.sendMessage(
          from,
          '❌ No encontre productos.\n\n' +
          'Proba con otro termino o escribi *categorias*'
        );
        return;
      }

      conversacion.data.productos = productosEncontrados;
      conversacion.data.substep = 'seleccionar';
      conversaciones. set(from, conversacion);

      let mensaje = `🎯 *Encontre ${productosEncontrados. length} productos:*\n\n`;
      
      productosEncontrados.slice(0, 10).forEach((prod: any, index: number) => {
        mensaje += `${index + 1}.  *${prod.nombre}*\n`;
        mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
        if (prod.unidad) mensaje += ` ${prod.unidad}`;
        mensaje += `\n\n`;
      });

      mensaje += '📝 Para agregar escribi:\n';
      mensaje += '*agregar [numero] [cantidad]*\n';
      mensaje += 'Ejemplo: agregar 1 2';

      await this.sendMessage(from, mensaje);
      return;
    }

    // 3. Agregar productos
    if (substep === 'seleccionar') {
      if (body. startsWith('agregar')) {
        const partes = body.split(' ');
        
        if (partes.length < 3) {
          await this.sendMessage(
            from,
            '❌ Formato incorrecto.\n\n' +
            'Usa: *agregar [numero] [cantidad]*\n' +
            'Ejemplo: agregar 1 2'
          );
          return;
        }

        const numeroProducto = parseInt(partes[1]) - 1;
        const cantidad = parseInt(partes[2]);

        if (isNaN(numeroProducto) || isNaN(cantidad) || cantidad < 1) {
          await this.sendMessage(from, '❌ Numero o cantidad invalidos.');
          return;
        }

        const producto = productos[numeroProducto];

        if (!producto) {
          await this.sendMessage(from, '❌ Numero de producto invalido.');
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

        await this.sendMessage(
          from,
          `✅ Agregado al carrito:\n\n` +
          `📦 ${producto.nombre} x${cantidad}\n` +
          `💰 $${subtotal. toLocaleString('es-AR')}\n\n` +
          `Podes:\n` +
          `➕ Seguir buscando productos\n` +
          `🛒 Escribir *ver carrito*\n` +
          `✅ Escribir *confirmar* para finalizar`
        );
        return;
      }

      if (body.includes('ver carrito') || body.includes('carrito')) {
        await this.mostrarCarrito(from, carrito);
        return;
      }

      if (body.includes('confirmar')) {
        if (carrito.length === 0) {
          await this.sendMessage(from, '❌ Tu carrito esta vacio.');
          return;
        }

        conversacion.data.substep = 'entrega';
        conversaciones.set(from, conversacion);

        await this.sendMessage(
          from,
          '📍 *TIPO DE ENTREGA*\n\n' +
          '1️⃣ 🚚 Delivery (+$500)\n' +
          '2️⃣ 🏪 Retiro en local (Gratis)\n\n' +
          'Escribi 1 o 2:'
        );
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
        const items = carrito.map((item: any) => ({
          productoId: item.productoId,
          cantidad: item.cantidad
        }));

        const pedido = await pedidoService.crear({
          clienteTelefono: from,
          items,
          tipoEntrega
        });

        const resumen = await pedidoService. obtenerResumen(pedido. id);

        // Limpiar conversación
        conversaciones.delete(from);

        await this.sendMessage(
          from,
          '✅ *PEDIDO CONFIRMADO*\n\n' +
          resumen +
          '\n\n' +
          '📞 Te contactaremos para coordinar la entrega.\n' +
          '¡Gracias por tu compra!  🎉\n\n' +
          'Escribi *menu* para volver al inicio.'
        );

      } catch (error: any) {
        await this. sendMessage(
          from,
          '❌ Error al crear el pedido:\n' +
          error.message +
          '\n\nIntenta nuevamente.'
        );
        conversaciones.delete(from);
      }
      return;
    }
  }

  private async handleConsulta(message: Message, body: string): Promise<void> {
    const from = message.from;

    // Obtener categorías dinámicamente desde la BD
    const categoriasDisponibles = await productoService.obtenerCategorias();
    const bodyUpper = body.toUpperCase().replace(/ /g, '_');
    
    const categoriaSeleccionada = categoriasDisponibles.find(cat => {
      const catUpper = cat.toUpperCase();
      return bodyUpper === catUpper || bodyUpper === catUpper.replace(/_/g, ' ');
    });

    let productos;

    if (categoriaSeleccionada) {
      productos = await productoService.obtenerPorCategoria(categoriaSeleccionada);
    } else {
      productos = await productoService.buscar(body);
    }

    conversaciones.delete(from);

    if (productos.length === 0) {
      await this.sendMessage(
        from,
        '❌ No encontre ese producto.\n\n' +
        'Proba con otro nombre o escribi *menu*'
      );
      return;
    }

    let mensaje = `🔍 Resultados para "${body}":\n\n`;

    productos.slice(0, 5).forEach((prod: any) => {
      mensaje += `📦 *${prod.nombre}*\n`;
      mensaje += `   💰 $${Number(prod.precio).toLocaleString('es-AR')}`;
      if (prod.unidad) mensaje += ` ${prod.unidad}`;
      mensaje += `\n`;
      mensaje += `   📂 ${prod.categoria. replace(/_/g, ' ')}\n`;
      mensaje += `   ${prod.stock ?  '✅ En stock' : '❌ Sin stock'}\n\n`;
    });

    mensaje += '¿Queres hacer un pedido?  Escribi *pedido*';

    await this.sendMessage(from, mensaje);
  }

  private async mostrarCarrito(from: string, carrito: any[]): Promise<void> {
    if (carrito.length === 0) {
      await this.sendMessage(from, '🛒 Tu carrito esta vacio.');
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

  private async mostrarHistorial(from: string): Promise<void> {
    const pedidos = await clienteService.obtenerHistorialPedidos(from, 5);

    if (pedidos.length === 0) {
      await this.sendMessage(
        from,
        '📋 Todavia no tenes pedidos realizados.\n\n' +
        'Escribi *pedido* para hacer tu primera compra!  🛒'
      );
      return;
    }

    let mensaje = '📋 *TUS ULTIMOS PEDIDOS:*\n\n';

    pedidos.forEach((pedido) => {
      mensaje += `🔹 *${pedido.numero}*\n`;
      mensaje += `   📅 ${new Date(pedido.fecha).toLocaleDateString('es-AR')}\n`;
      mensaje += `   💰 $${Number(pedido.total).toLocaleString('es-AR')}\n`;
      mensaje += `   📍 ${pedido.tipoEntrega === 'DELIVERY' ? 'Delivery' : 'Retiro'}\n`;
      mensaje += `   ${pedido.estado === 'ENTREGADO' ? '✅' : '⏳'} ${pedido.estado}\n\n`;
    });

    await this.sendMessage(from, mensaje);
  }

  private async mostrarCategorias(from: string): Promise<void> {
    // Obtener categorías dinámicamente desde la BD
    const categorias = await productoService.obtenerCategorias();

    let mensaje = '📂 *CATEGORIAS DISPONIBLES*\n\n';
    categorias.forEach((cat, index) => {
      mensaje += `${index + 1}️⃣ ${cat.replace(/_/g, ' ')}\n`;
    });

    mensaje += '\nEscribi el nombre de una categoria o busca un producto. ';

    await this.sendMessage(from, mensaje);
  }

  private async mostrarInformacion(from: string): Promise<void> {
    const mensaje = 
      '🏪 *INFORMACION DEL LOCAL*\n\n' +
      '📍 Direccion: [Tu direccion aqui]\n' +
      '🕐 Horarios:\n' +
      '   Lunes a Viernes: 9:00 - 19:00\n' +
      '   Sabados: 9:00 - 13:00\n' +
      '   Domingos: Cerrado\n\n' +
      '💳 *MEDIOS DE PAGO:*\n' +
      '✅ Efectivo\n' +
      '✅ Transferencia\n' +
      '✅ Mercado Pago\n' +
      '✅ Tarjetas\n\n' +
      '📞 Tambien podes hacer pedidos por este chat 24/7';

    await this.sendMessage(from, mensaje);
  }

  /**
   * Verificar si un número está en la whitelist
   */
  isWhitelisted(numero: string): boolean {
    if (env.WHATSAPP_WHITELIST.length === 0) return true;
    
    const numeroLimpio = numero.replace(/\D/g, '');
    return env.WHATSAPP_WHITELIST.some(n => 
      numeroLimpio.includes(n) || n. includes(numeroLimpio)
    );
  }

  /**
   * Obtener lista de números autorizados
   */
  getWhitelist(): string[] {
    return env.WHATSAPP_WHITELIST;
  }

  async initialize(): Promise<void> {
    if (! this.client) {
      throw new Error('Cliente no inicializado');
    }

    logger.info('Iniciando cliente de WhatsApp.. .');
    await this.client.initialize();
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.client || !this.isReady) {
      throw new Error('Cliente no esta listo');
    }

    try {
      await this.client. sendMessage(to, message);
      logger.info('Mensaje enviado a ' + to);
    } catch (error) {
      logger. error('Error al enviar mensaje', error as Error);
      throw error;
    }
  }

  async sendMediaMessage(to: string, mediaPath: string, caption?: string): Promise<void> {
    if (!this.client || !this.isReady) {
      throw new Error('Cliente no esta listo');
    }

    try {
      const { MessageMedia } = await import('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(mediaPath);
      await this.client. sendMessage(to, media, { caption });
      logger.info('Mensaje con media enviado a ' + to);
    } catch (error) {
      logger.error('Error al enviar mensaje con media', error as Error);
      throw error;
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  isClientReady(): boolean {
    return this.isReady;
  }
}

export const whatsappService = new WhatsAppService();