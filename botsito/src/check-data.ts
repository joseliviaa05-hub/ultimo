/**
 * Verificar si hay datos en la base de datos
 */

import './config/env';
import { prisma } from './services/prisma.service';

async function checkData() {
  console.log('\n[CHECK] VERIFICANDO DATOS EN BASE DE DATOS...\n');
  console.log('='.repeat(60));

  try {
    // Contar registros en cada tabla
    const [
      productosCount,
      clientesCount,
      pedidosCount,
      itemsCount,
      imagenesCount,
      usuariosCount,
    ] = await Promise.all([
      prisma.producto.count(),
      prisma.cliente.count(),
      prisma.pedido.count(),
      prisma. itemPedido.count(),
      prisma.imagenProducto.count(),
      prisma.usuario.count(),
    ]);

    console.log('\n📊 RESUMEN DE DATOS:\n');
    console.log(`  Productos:        ${productosCount}`);
    console.log(`  Clientes:         ${clientesCount}`);
    console.log(`  Pedidos:          ${pedidosCount}`);
    console.log(`  Items de pedido:  ${itemsCount}`);
    console.log(`  Imágenes:         ${imagenesCount}`);
    console.log(`  Usuarios:         ${usuariosCount}`);
    console.log('');

    const total = productosCount + clientesCount + pedidosCount + itemsCount + imagenesCount + usuariosCount;

    if (total === 0) {
      console. log('❌ BASE DE DATOS VACIA - No hay datos');
      console.log('');
      console.log('Para agregar datos:');
      console.log('  1. Usar el bot de WhatsApp y agregar productos');
      console. log('  2. Usar la API REST para crear productos');
      console.log('  3. Crear un script de seeds con datos de prueba');
      console.log('');
    } else {
      console.log(`✅ BASE DE DATOS CON DATOS - Total: ${total} registros`);
      console. log('');
    }

    // Mostrar algunos ejemplos si hay datos
    if (productosCount > 0) {
      console.log('📦 Primeros 5 productos:');
      const productos = await prisma.producto.findMany({ take: 5 });
      productos.forEach(p => {
        console.log(`  - ${p.nombre} (${p.categoria}) - $${p.precio}`);
      });
      console.log('');
    }

    if (clientesCount > 0) {
      console. log('👥 Primeros 5 clientes:');
      const clientes = await prisma.cliente. findMany({ take: 5 });
      clientes.forEach(c => {
        console.log(`  - ${c.nombre} (${c.telefono}) - ${c.totalPedidos} pedidos`);
      });
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('');

  } catch (error: any) {
    console.error('[ERROR]', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkData();