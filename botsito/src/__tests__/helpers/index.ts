import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Limpia todas las tablas de la base de datos
 */
export async function cleanDatabase() {
  // Orden importante: eliminar en orden inverso a las foreign keys
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
}

/**
 * Crea un cliente de test
 */
export async function createTestCliente(
  telefono: string = '5491112345678',
  nombre: string = 'Cliente Test'
) {
  return await prisma. cliente.create({
    data: {
      telefono,
      nombre,
    },
  });
}

/**
 * Crea un producto de test
 */
export async function createTestProducto(data?: Partial<any>) {
  return await prisma.producto.create({
    data: {
      nombre: data?.nombre || 'Producto Test',
      categoria: data?.categoria || 'LIBRERIA',
      subcategoria: data?.subcategoria || 'test',
      precio: data?.precio || 100,
      stock: data?.stock !== undefined ? data.stock : true,
      ...data,
    },
  });
}

/**
 * Genera datos aleatorios para tests
 */
export const faker = {
  email: () => `test${Date.now()}${Math.random()}@example.com`,
  phone: () => `54911${Math.floor(10000000 + Math.random() * 90000000)}`,
  nombre: () => `Test ${Date.now()}${Math.floor(Math.random() * 1000)}`,
  precio: () => Math.floor(Math.random() * 10000) + 100,
};

/**
 * Espera X milisegundos
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Desconectar Prisma después de todos los tests
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}