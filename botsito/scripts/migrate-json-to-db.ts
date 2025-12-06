/**
 * ═══════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRACIÓN - JSON → PostgreSQL
 * ═══════════════════════════════════════════════════════════════
 */

import { PrismaClient, Categoria, TipoEntrega, EstadoPedido, EstadoPago } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════

function normalizarCategoria(categoria: string): Categoria {
  const map: Record<string, Categoria> = {
    libreria: 'LIBRERIA',
    cotillon: 'COTILLON',
    jugueteria: 'JUGUETERIA',
    juguetes: 'JUGUETERIA',
    fotocopiadora: 'FOTOCOPIADORA',
    impresiones: 'IMPRESIONES',
    bijou: 'BIJOU',
    accesorio_para_celular: 'ACCESORIO_CELULAR',
    accesorio_celular: 'ACCESORIO_CELULAR',
    accesorios_computadora: 'ACCESORIOS_COMPUTADORA',
    higiene: 'HIGIENE',
    varios: 'VARIOS',
  };

  return map[categoria. toLowerCase()] || 'VARIOS';
}

function normalizarTipoEntrega(tipo: string): TipoEntrega {
  return tipo.toLowerCase() === 'delivery' ? 'DELIVERY' : 'RETIRO';
}

function normalizarEstadoPedido(estado: string): EstadoPedido {
  const map: Record<string, EstadoPedido> = {
    pendiente: 'PENDIENTE',
    confirmado: 'CONFIRMADO',
    en_preparacion: 'EN_PREPARACION',
    listo: 'LISTO',
    entregado: 'ENTREGADO',
    cancelado: 'CANCELADO',
  };

  return map[estado.toLowerCase()] || 'PENDIENTE';
}

// ════════════════════════════════════════════════════════════════
// MIGRACIÓN DE CLIENTES
// ════════════════════════════════════════════════════════════════

async function migrarClientes() {
  console.log('\n📦 Migrando clientes...');

  const dataPath = path.join(__dirname, '../data/clientes.json');
  const raw = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  let migrados = 0;
  let errores = 0;

  for (const cliente of data. clientes) {
    try {
      if (! cliente.telefono || cliente.telefono === 'status@broadcast') {
        console.log(`⚠️  Saltando cliente inválido: ${cliente.telefono}`);
        continue;
      }

      await prisma.cliente.create({
        data: {
          telefono: cliente.telefono,
          nombre: cliente.nombre || 'Sin nombre',
          fechaRegistro: new Date(cliente.fecha_registro || Date.now()),
          ultimaInteraccion: new Date(cliente. ultima_interaccion || Date. now()),
          totalPedidos: cliente.total_pedidos || 0,
          totalGastado: cliente.total_gastado || 0,
        },
      });

      migrados++;
      console.log(`✅ Cliente migrado: ${cliente.nombre} (${cliente.telefono})`);
    } catch (error: any) {
      errores++;
      console.error(`❌ Error migrando cliente ${cliente.telefono}:`, error.message);
    }
  }

  console.log(`\n✅ Clientes migrados: ${migrados}`);
  console.log(`❌ Errores: ${errores}`);
}

// ════════════════════════════════════════════════════════════════
// MIGRACIÓN DE PRODUCTOS
// ════════════════════════════════════════════════════════════════

async function migrarProductos() {
  console. log('\n📦 Migrando productos...');

  const dataPath = path.join(__dirname, '../data/lista-precios.json');
  const raw = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  let migrados = 0;
  let errores = 0;

  for (const [categoriaKey, subcategorias] of Object.entries(data)) {
    const categoria = normalizarCategoria(categoriaKey);

    for (const [subcategoriaKey, productos] of Object.entries(subcategorias as any)) {
      for (const [nombreKey, info] of Object.entries(productos as any)) {
        try {
          const infoProducto = info as any;

          const producto = await prisma.producto.create({
            data: {
              nombre: nombreKey. replace(/_/g, ' '),
              categoria,
              subcategoria: subcategoriaKey. replace(/_/g, ' '),
              precio: infoProducto.precio || infoProducto.precio_desde || 0,
              precioDesde: infoProducto. precio_desde,
              unidad: infoProducto.unidad,
              stock: infoProducto.stock !== false,
              codigoBarras: infoProducto.codigo_barras,
            },
          });

          if (infoProducto.imagenes && Array.isArray(infoProducto.imagenes)) {
            for (let i = 0; i < infoProducto.imagenes.length; i++) {
              const img = infoProducto.imagenes[i];
              
              await prisma.imagenProducto.create({
                data: {
                  productoId: producto.id,
                  url: img.url,
                  publicId: img.public_id || img.publicId || '',
                  width: img. width || 0,
                  height: img.height || 0,
                  format: img.format || 'jpg',
                  size: img.size || 0,
                  orden: i,
                },
              });
            }
          }

          migrados++;
          console.log(`✅ Producto migrado: ${categoria} → ${nombreKey}`);
        } catch (error: any) {
          errores++;
          console.error(`❌ Error migrando producto ${nombreKey}:`, error. message);
        }
      }
    }
  }

  console.log(`\n✅ Productos migrados: ${migrados}`);
  console.log(`❌ Errores: ${errores}`);
}

// ════════════════════════════════════════════════════════════════
// MIGRACIÓN DE PEDIDOS
// ════════════════════════════════════════════════════════════════

async function migrarPedidos() {
  console.log('\n📦 Migrando pedidos...');

  const dataPath = path. join(__dirname, '../data/pedidos.json');
  const raw = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  let migrados = 0;
  let errores = 0;

  for (const pedido of data.pedidos) {
    try {
      let cliente = await prisma.cliente.findUnique({
        where: { telefono: pedido.cliente },
      });

      if (!cliente) {
        console.log(`⚠️  Cliente no encontrado, creando: ${pedido.cliente}`);
        cliente = await prisma.cliente.create({
          data: {
            telefono: pedido. cliente,
            nombre: pedido.nombre || 'Cliente Migrado',
            fechaRegistro: new Date(pedido.fecha),
          },
        });
      }

      const pedidoCreado = await prisma.pedido.create({
        data: {
          numero: pedido.id,
          clienteId: cliente.id,
          nombreCliente: pedido.nombre,
          fecha: new Date(pedido.fecha),
          subtotal: pedido.subtotal,
          descuento: pedido.descuento || 0,
          descuentoPorcentaje: pedido.descuento_porcentaje,
          delivery: pedido.delivery || 0,
          total: pedido.total,
          tipoEntrega: normalizarTipoEntrega(pedido.tipo_entrega),
          estado: normalizarEstadoPedido(pedido.estado),
          estadoPago: (pedido.estado_pago?. toUpperCase() as EstadoPago) || 'PENDIENTE',
        },
      });

      for (const item of pedido.productos) {
        const producto = await prisma.producto. findFirst({
          where: {
            nombre: {
              contains: item.nombre,
              mode: 'insensitive',
            },
          },
        });

        await prisma.itemPedido.create({
          data: {
            pedidoId: pedidoCreado. id,
            productoId: producto?.id || '',
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precio_unitario,
            subtotal: item.subtotal,
          },
        });
      }

      migrados++;
      console.log(`✅ Pedido migrado: ${pedido.id}`);
    } catch (error: any) {
      errores++;
      console.error(`❌ Error migrando pedido ${pedido. id}:`, error.message);
    }
  }

  console.log(`\n✅ Pedidos migrados: ${migrados}`);
  console. log(`❌ Errores: ${errores}`);
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 INICIANDO MIGRACIÓN DE DATOS JSON → PostgreSQL');
    console. log('═══════════════════════════════════════════════════════════');

    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    console.log('\n🗑️  Limpiando datos existentes...');
    await prisma.itemPedido.deleteMany();
    await prisma.pedido.deleteMany();
    await prisma.imagenProducto.deleteMany();
    await prisma.producto.deleteMany();
    await prisma. cliente.deleteMany();
    console.log('✅ Datos limpiados');

    await migrarClientes();
    await migrarProductos();
    await migrarPedidos();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════');

    const stats = {
      clientes: await prisma.cliente. count(),
      productos: await prisma.producto.count(),
      pedidos: await prisma.pedido.count(),
      items: await prisma.itemPedido.count(),
      imagenes: await prisma.imagenProducto.count(),
    };

    console.log('\n📊 Estadísticas finales:');
    console.log(`   Clientes:  ${stats.clientes}`);
    console.log(`   Productos: ${stats.productos}`);
    console.log(`   Pedidos:   ${stats.pedidos}`);
    console.log(`   Items:     ${stats.items}`);
    console.log(`   Imágenes:  ${stats.imagenes}`);

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });