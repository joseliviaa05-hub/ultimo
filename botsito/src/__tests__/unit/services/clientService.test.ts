import clientService from '../../../services/cliente.service';
import { cleanDatabase, createTestCliente, faker, disconnectPrisma } from '../../helpers';

describe('ClientService', () => {
  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  describe('obtenerOCrear', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe crear un nuevo cliente', async () => {
      const telefono = faker.phone();
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '');

      const cliente = await clientService.obtenerOCrear(telefono);

      expect(cliente.telefono).toBe(telefonoLimpio);
      expect(cliente.totalPedidos).toBe(0);
      expect(Number(cliente.totalGastado)). toBe(0);
    });

    it('debe retornar cliente existente', async () => {
      const telefono = faker. phone();
      
      const cliente1 = await clientService.obtenerOCrear(telefono);
      const cliente2 = await clientService.obtenerOCrear(telefono);

      expect(cliente1.id).toBe(cliente2.id);
    });
  });

  describe('obtenerPorTelefono', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe retornar cliente existente', async () => {
      const telefono = faker.phone();
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
      const nombre = faker.nombre();
      
      await clientService.obtenerOCrear(telefono, nombre);

      const cliente = await clientService.obtenerPorTelefono(telefono);

      expect(cliente).not.toBeNull();
      expect(cliente?.telefono). toBe(telefonoLimpio);
      expect(cliente?. nombre).toBe(nombre);
    });

    it('debe retornar null si cliente no existe', async () => {
      const cliente = await clientService.obtenerPorTelefono('5491199999999');

      expect(cliente).toBeNull();
    });
  });

  describe('obtenerTodos', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe retornar lista paginada de clientes', async () => {
      // Crear 5 clientes únicos
      for (let i = 0; i < 5; i++) {
        const telefono = `549111${60000000 + i}`;
        await createTestCliente(telefono, `Cliente Pag ${i}`);
      }

      const resultado = await clientService.obtenerTodos(1, 10);

      expect(resultado.data).toHaveLength(5);
      expect(resultado.pagination.total).toBe(5);
      expect(resultado.pagination.page).toBe(1);
    });

    it('debe respetar límite de paginación', async () => {
      // Este test usa los mismos 5 clientes del test anterior
      // Crear 5 más para llegar a 10
      for (let i = 5; i < 10; i++) {
        const telefono = `549111${60000000 + i}`;
        await createTestCliente(telefono, `Cliente Pag ${i}`);
      }

      const resultado = await clientService.obtenerTodos(1, 5);

      expect(resultado.data).toHaveLength(5);
      expect(resultado. pagination.totalPages).toBe(2);
      expect(resultado. pagination.hasMore).toBe(true);
    });
  });

  describe('buscar', () => {
    beforeAll(async () => {
      await cleanDatabase();
    });

    it('debe buscar por nombre', async () => {
      // Crear clientes de prueba
      await createTestCliente('5491180000001', 'Juan Pérez');
      await createTestCliente('5491180000002', 'María García');
      await createTestCliente('5491180000003', 'Juan López');

      const resultados = await clientService.buscar('Juan');

      expect(resultados).toHaveLength(2);
      expect(resultados.every((c: any) => c.nombre.includes('Juan'))).toBe(true);
    });

    it('debe ser case-insensitive', async () => {
      // Este test usa los mismos clientes del test anterior
      const resultados = await clientService.buscar('juan');

      expect(resultados).toHaveLength(2);
    });
  });
});