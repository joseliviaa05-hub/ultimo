import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Creando datos de prueba...\n');
  console.log('='.repeat(60));

  try {
    // 1. Limpiar datos existentes (por si acaso)
    await prisma.itemPedido.deleteMany();
    await prisma.pedido.deleteMany();
    await prisma.imagenProducto.deleteMany();
    await prisma.producto.deleteMany();
    await prisma.cliente. deleteMany();
    await prisma.usuario.deleteMany();

    console.log('✅ Tablas limpiadas\n');

    // 2.  Crear productos
    console.log('📦 Creando productos...');

    const productos = await prisma.$transaction([
      prisma.producto.create({
        data: {
          nombre: 'Cuaderno Rivadavia 84 hojas',
          categoria: 'LIBRERIA',
          subcategoria: 'Cuadernos',
          precio: 2500,
          stock: true,
        },
      }),
      prisma.producto.create({
        data: {
          nombre: 'Lapiceras Bic Cristal x12',
          categoria: 'LIBRERIA',
          subcategoria: 'Lapiceras',
          precio: 1500,
          stock: true,
        },
      }),
      prisma.producto.create({
        data: {
          nombre: 'Resma A4 Autor 75g x500',
          categoria: 'FOTOCOPIADORA',
          subcategoria: 'Resmas',
          precio: 4500,
          stock: true,
        },
      }),
      prisma. producto.create({
        data: {
          nombre: 'Globos Metalizados Pack x10',
          categoria: 'COTILLON',
          subcategoria: 'Globos',
          precio: 3500,
          stock: true,
        },
      }),
      prisma.producto. create({
        data: {
          nombre: 'Cartas Pokemon Sobre Booster',
          categoria: 'JUGUETERIA',
          subcategoria: 'Cartas Coleccionables',
          precio: 1200,
          stock: true,
        },
      }),
      prisma.producto.create({
        data: {
          nombre: 'Set Geometría Maped',
          categoria: 'LIBRERIA',
          subcategoria: 'Geometría',
          precio: 800,
          stock: true,
        },
      }),
      prisma.producto. create({
        data: {
          nombre: 'Aros Dorados x12 pares',
          categoria: 'BIJOU',
          subcategoria: 'Aros',
          precio: 2000,
          precioDesde: 150,
          unidad: 'por par',
          stock: true,
        },
      }),
      prisma.producto.create({
        data: {
          nombre: 'Funda Samsung A54',
          categoria: 'ACCESORIO_CELULAR',
          subcategoria: 'Fundas',
          precio: 1800,
          stock: true,
        },
      }),
      prisma.producto.create({
        data: {
          nombre: 'Mouse Inalámbrico Logitech',
          categoria: 'ACCESORIOS_COMPUTADORA',
          subcategoria: 'Mouse',
          precio: 5500,
          stock: true,
        },
      }),
      prisma.producto.create({
        data: {
          nombre: 'Alcohol en Gel 500ml',
          categoria: 'HIGIENE',
          subcategoria: 'Desinfectantes',
          precio: 900,
          stock: true,
        },
      }),
    ]);

    console.log(`   ✅ ${productos.length} productos creados\n`);

    // 3. Crear clientes
    console.log('👥 Creando clientes.. .');

    const clientes = await prisma.$transaction([
      prisma.cliente.create({
        data: {
          telefono: '+5491162002289',
          nombre: 'Jose Olivia',
          totalPedidos: 0,
          totalGastado: 0,
        },
      }),
      prisma.cliente.create({
        data: {
          telefono: '+5491160208947',
          nombre: 'María García',
          totalPedidos: 0,
          totalGastado: 0,
        },
      }),
      prisma.cliente. create({
        data: {
          telefono: '+5491198765432',
          nombre: 'Juan Pérez',
          totalPedidos: 0,
          totalGastado: 0,
        },
      }),
      prisma.cliente.create({
        data: {
          telefono: '+5491155555555',
          nombre: 'Ana Martínez',
          totalPedidos: 0,
          totalGastado: 0,
        },
      }),
    ]);

    console. log(`   ✅ ${clientes.length} clientes creados\n`);

    // 4. Crear pedido de ejemplo
    console.log('📋 Creando pedidos de ejemplo...');

    const pedido1 = await prisma.pedido.create({
      data: {
        numero: 'PED-001',
        clienteId: clientes[0]. id,
        nombreCliente: clientes[0].nombre,
        subtotal: 4000,
        descuento: 0,
        delivery: 500,
        total: 4500,
        tipoEntrega: 'DELIVERY',
        estado: 'PENDIENTE',
        estadoPago: 'PENDIENTE',
        items: {
          create: [
            {
              productoId: productos[0].id,
              nombre: productos[0].nombre,
              cantidad: 1,
              precioUnitario: 2500,
              subtotal: 2500,
            },
            {
              productoId: productos[1].id,
              nombre: productos[1].nombre,
              cantidad: 1,
              precioUnitario: 1500,
              subtotal: 1500,
            },
          ],
        },
      },
    });

    const pedido2 = await prisma.pedido.create({
      data: {
        numero: 'PED-002',
        clienteId: clientes[1].id,
        nombreCliente: clientes[1].nombre,
        subtotal: 4500,
        descuento: 0,
        delivery: 0,
        total: 4500,
        tipoEntrega: 'RETIRO',
        estado: 'CONFIRMADO',
        estadoPago: 'PAGADO',
        items: {
          create: [
            {
              productoId: productos[2].id,
              nombre: productos[2].nombre,
              cantidad: 1,
              precioUnitario: 4500,
              subtotal: 4500,
            },
          ],
        },
      },
    });

    console.log(`   ✅ 2 pedidos creados\n`);

    // 5.  Actualizar totales de clientes
    await prisma.cliente.update({
      where: { id: clientes[0].id },
      data: { totalPedidos: 1, totalGastado: 4500 },
    });

    await prisma.cliente.update({
      where: { id: clientes[1].id },
      data: { totalPedidos: 1, totalGastado: 4500 },
    });

    console.log('✅ Totales actualizados\n');

    // 6. Crear usuario admin
    console.log('👤 Creando usuario admin...');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.usuario.create({
      data: {
        email: 'admin@botsitot.com',
        password: hashedPassword,
        nombre: 'Administrador',
        rol: 'ADMIN',
        activo: true,
      },
    });

    console.log('   ✅ Usuario admin creado\n');
    console.log('   📧 Email: admin@botsitot.com');
    console.log('   🔑 Password: admin123\n');

    console.log('='.repeat(60));
    console.log('\n🎉 SEEDS COMPLETADOS\n');
    console.log('📊 Resumen:');
    console.log(`   - ${productos.length} productos`);
    console.log(`   - ${clientes.length} clientes`);
    console.log(`   - 2 pedidos`);
    console.log('   - 1 usuario admin\n');

  } catch (error) {
    console.error('\n❌ Error en seeds:', error);
    throw error;
  }
}

main()
  . catch((e) => {
    console.error(e);
    process.exit(1);
  })
  . finally(async () => {
    await prisma.$disconnect();
  });