import pedidoService from '../../../services/pedido.service';
import { cleanDatabase, createTestCliente, createTestProducto, disconnectPrisma } from '../../helpers';
import { prisma } from '../../../services/prisma.service';

describe('PedidoService', () => {
  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  describe('crear', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe crear un pedido básico', async () => {
      // Preparar datos
      const producto = await createTestProducto({
        nombre: 'Cuaderno',
        precio: 1000,
        stock: true,
      });

      const data = {
        clienteTelefono: '5491112345678',
        items: [
          {
            productoId: producto.id,
            cantidad: 2,
          },
        ],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      // Ejecutar
      const pedido = await pedidoService.crear(data);

      // Verificar
      expect(pedido). not.toBeNull();
      expect(pedido.numero).toMatch(/PED-\d{4}/);
      expect(Number(pedido.subtotal)).toBe(2000); // 1000 * 2
      expect(Number(pedido.total)).toBe(2000); // Sin delivery ni descuento
      expect(pedido.items). toHaveLength(1);
      expect(pedido.tipoEntrega).toBe('RETIRO');
    });

    it('debe crear cliente automáticamente si no existe', async () => {
      const producto = await createTestProducto({ precio: 500 });

      const data = {
        clienteTelefono: '5491199887766',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      const pedido = await pedidoService. crear(data);

      // Verificar que se creó el cliente
      const cliente = await prisma.cliente. findUnique({
        where: { telefono: '5491199887766' },
      });

      expect(cliente).not.toBeNull();
      expect(cliente?. nombre).toBe('Cliente WhatsApp');
      expect(pedido.clienteId).toBe(cliente?. id);
    });

    it('debe calcular delivery correctamente', async () => {
      const producto = await createTestProducto({ precio: 1000 });

      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto. id, cantidad: 1 }],
        tipoEntrega: 'DELIVERY' as 'DELIVERY',
      };

      const pedido = await pedidoService.crear(data);

      expect(Number(pedido.subtotal)).toBe(1000);
      expect(Number(pedido.delivery)).toBe(500);
      expect(Number(pedido.total)).toBe(1500); // 1000 + 500
    });

    it('debe aplicar descuento correctamente', async () => {
      const producto = await createTestProducto({ precio: 1000 });

      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
        descuentoPorcentaje: 10, // 10% de descuento
      };

      const pedido = await pedidoService.crear(data);

      expect(Number(pedido. subtotal)).toBe(1000);
      expect(Number(pedido.descuento)).toBe(100); // 10% de 1000
      expect(pedido.descuentoPorcentaje).toBe(10);
      expect(Number(pedido.total)).toBe(900); // 1000 - 100
    });

    it('debe calcular total con descuento y delivery', async () => {
      const producto = await createTestProducto({ precio: 2000 });

      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 2 }],
        tipoEntrega: 'DELIVERY' as 'DELIVERY',
        descuentoPorcentaje: 20,
      };

      const pedido = await pedidoService.crear(data);

      expect(Number(pedido.subtotal)).toBe(4000); // 2000 * 2
      expect(Number(pedido.descuento)).toBe(800); // 20% de 4000
      expect(Number(pedido.delivery)). toBe(500);
      expect(Number(pedido.total)).toBe(3700); // 4000 - 800 + 500
    });

    it('debe actualizar estadísticas del cliente', async () => {
      const cliente = await createTestCliente('5491188776655', 'Test Cliente');
      const producto = await createTestProducto({ precio: 1500 });

      const data = {
        clienteTelefono: '5491188776655',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      await pedidoService.crear(data);

      // Verificar estadísticas actualizadas
      const clienteActualizado = await prisma.cliente.findUnique({
        where: { id: cliente.id },
      });

      expect(clienteActualizado?.totalPedidos). toBe(1);
      expect(Number(clienteActualizado?.totalGastado)).toBe(1500);
    });

    it('debe lanzar error si producto no existe', async () => {
      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: 'producto-inexistente', cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      await expect(pedidoService.crear(data)).rejects.toThrow('no encontrado');
    });

    it('debe lanzar error si producto sin stock', async () => {
      const producto = await createTestProducto({
        nombre: 'Sin Stock',
        precio: 1000,
        stock: false, // ❌ Sin stock
      });

      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      await expect(pedidoService.crear(data)).rejects.toThrow('sin stock');
    });

    it('debe generar números de pedido secuenciales', async () => {
      const producto = await createTestProducto({ precio: 100 });

      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      const pedido1 = await pedidoService. crear(data);
      const pedido2 = await pedidoService.crear(data);
      const pedido3 = await pedidoService.crear(data);

      // Extraer números
      const num1 = parseInt(pedido1.numero.split('-')[1]);
      const num2 = parseInt(pedido2.numero.split('-')[1]);
      const num3 = parseInt(pedido3.numero.split('-')[1]);

      expect(num2).toBe(num1 + 1);
      expect(num3).toBe(num2 + 1);
    });
  });

  describe('obtenerPorNumero', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe obtener pedido por número', async () => {
      // Crear pedido
      const producto = await createTestProducto({ precio: 500 });
      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      const pedidoCreado = await pedidoService.crear(data);

      // Buscar por número
      const pedidoEncontrado = await pedidoService.obtenerPorNumero(pedidoCreado.numero);

      expect(pedidoEncontrado).not.toBeNull();
      expect(pedidoEncontrado?.id).toBe(pedidoCreado.id);
      expect(pedidoEncontrado?.numero).toBe(pedidoCreado.numero);
      expect(pedidoEncontrado?.items).toHaveLength(1);
    });

    it('debe retornar null si pedido no existe', async () => {
      const pedido = await pedidoService.obtenerPorNumero('PED-9999');

      expect(pedido).toBeNull();
    });
  });

  describe('actualizarEstado', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe actualizar estado del pedido', async () => {
      // Crear pedido
      const producto = await createTestProducto({ precio: 500 });
      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      const pedido = await pedidoService.crear(data);

      // Actualizar estado
      const pedidoActualizado = await pedidoService.actualizarEstado(
        pedido.id,
        'CONFIRMADO'
      );

      expect(pedidoActualizado. estado).toBe('CONFIRMADO');
    });
  });

  describe('actualizarEstadoPago', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe actualizar estado de pago', async () => {
      // Crear pedido
      const producto = await createTestProducto({ precio: 500 });
      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 1 }],
        tipoEntrega: 'RETIRO' as 'RETIRO',
      };

      const pedido = await pedidoService. crear(data);

      // Verificar que empieza como PENDIENTE
      expect(pedido.estadoPago). toBe('PENDIENTE');

      // Actualizar a PAGADO
      const pedidoActualizado = await pedidoService.actualizarEstadoPago(
        pedido.id,
        'PAGADO'
      );

      expect(pedidoActualizado.estadoPago).toBe('PAGADO');
    });
  });

  describe('obtenerResumen', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe generar resumen de pedido', async () => {
      // Crear pedido
      const producto = await createTestProducto({
        nombre: 'Cuaderno A4',
        precio: 1500,
      });

      const data = {
        clienteTelefono: '5491112345678',
        items: [{ productoId: producto.id, cantidad: 2 }],
        tipoEntrega: 'DELIVERY' as 'DELIVERY',
        descuentoPorcentaje: 10,
      };

      const pedido = await pedidoService. crear(data);

      // Obtener resumen
      const resumen = await pedidoService. obtenerResumen(pedido. id);

      // Verificar contenido
      expect(resumen). toContain('PEDIDO');
      expect(resumen).toContain(pedido.numero);
      expect(resumen).toContain('Cuaderno A4');
      expect(resumen).toContain('x2');
      expect(resumen).toContain('Subtotal');
      expect(resumen).toContain('Descuento');
      expect(resumen).toContain('Delivery');
      expect(resumen).toContain('TOTAL');
    });

    it('debe retornar mensaje si pedido no existe', async () => {
      const resumen = await pedidoService. obtenerResumen('id-inexistente');

      expect(resumen).toBe('Pedido no encontrado');
    });
  });
});