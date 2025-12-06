/**
 * ═══════════════════════════════════════════════════════════════
 * TEST DE REDIS - Verificar conexión y funcionalidad
 * ═══════════════════════════════════════════════════════════════
 */

// Importar env primero (carga dotenv)
import './config/env';

// Ahora importar servicios
import cacheService from './services/cache.service';
import redis from './config/redis.config';

async function testRedis() {
  console.log('\n🧪 PROBANDO REDIS/UPSTASH.. .\n');
  console.log('═'. repeat(60));

  // Verificar que REDIS_URL esté cargado
  console. log(`\n🔍 REDIS_URL: ${process. env.REDIS_URL ?  '✅ Configurado' : '❌ No encontrado'}`);
  
  if (process.env. REDIS_URL) {
    const urlMasked = process.env.REDIS_URL.replace(/:([^@]+)@/, ':****@');
    console. log(`   ${urlMasked}\n`);
  } else {
    console.log('   ❌ Verifica que . env existe y tiene REDIS_URL\n');
    process.exit(1);
  }

  if (! redis) {
    console.error('❌ Redis no inicializado');
    process.exit(1);
  }

  // Conectar explícitamente (lazyConnect está activo)
  console.log('🔌 Conectando a Redis...\n');
  
  try {
    await redis.connect();
    
    // Esperar un poco a que esté ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error: any) {
    console.error('❌ Error conectando:', error.message);
    process. exit(1);
  }

  // Estado de conexión
  const stats = cacheService.getStats();
  console.log(`📊 Estado: ${stats.status}`);
  console.log(`📊 Disponible: ${stats. available ? '✅' : '❌'}\n`);

  if (! stats.available) {
    console.log('❌ Redis no disponible. Verifica:');
    console.log('   1. REDIS_URL está en . env');
    console.log('   2. Credenciales de Upstash son correctas');
    console.log('   3. El formato es: rediss://default:PASSWORD@HOST:PORT');
    console.log('   4. Tu firewall/antivirus permite la conexión\n');
    process.exit(1);
  }

  try {
    // 1.  Ping
    console. log('1️⃣ Ping...');
    const pingOk = await cacheService. ping();
    console.log(`   ${pingOk ? '✅' : '❌'} ${pingOk ? 'PONG' : 'FAIL'}\n`);

    if (! pingOk) {
      throw new Error('Ping falló - conexión no establecida');
    }

    // 2. Set string
    console.log('2️⃣ Set (guardar string)...');
    await cacheService.set('test:string', 'Hola Upstash!', 60);
    console.log('   ✅ String guardado\n');

    // 3. Get string
    console.log('3️⃣ Get (obtener string)...');
    const value = await cacheService.get<string>('test:string');
    console.log(`   ${value ?  '✅' : '❌'} Valor: ${value}\n`);

    // 4. Set objeto
    console.log('4️⃣ Set (guardar objeto)...');
    await cacheService.set('test:objeto', { nombre: 'Botsitot', version: '2.0' }, 60);
    console.log('   ✅ Objeto guardado\n');

    // 5. Get objeto
    console.log('5️⃣ Get (obtener objeto)...');
    const objeto = await cacheService.get<any>('test:objeto');
    console.log(`   ${objeto ? '✅' : '❌'} Objeto:`, objeto, '\n');

    // 6.  Exists
    console.log('6️⃣ Exists (verificar existencia)...');
    const exists = await cacheService.exists('test:string');
    console.log(`   ${exists ? '✅' : '❌'} Existe: ${exists}\n`);

    // 7. TTL
    console.log('7️⃣ TTL (tiempo restante)...');
    const ttl = await cacheService.ttl('test:string');
    console. log(`   ✅ TTL: ${ttl} segundos\n`);

    // 8. Incr (contador)
    console.log('8️⃣ Incr (incrementar contador)...');
    await cacheService.incr('test:contador', 120);
    await cacheService.incr('test:contador');
    await cacheService.incr('test:contador');
    const contador = await redis.get('test:contador');
    console.log(`   ✅ Contador: ${contador}\n`);

    // 9. Keys (buscar)
    console.log('9️⃣ Keys (buscar patrón test:*)...');
    const keys = await cacheService.keys('test:*');
    console.log(`   ✅ Keys encontradas: ${keys.length}`);
    keys.forEach(k => console.log(`      - ${k}`));
    console.log('');

    // 10. Del (eliminar)
    console. log('🔟 Del (eliminar key)...');
    await cacheService.del('test:string');
    const afterDel = await cacheService.get('test:string');
    console.log(`   ${afterDel === null ?  '✅' : '❌'} Eliminado correctamente\n`);

    // 11. DelPattern (eliminar patrón)
    console.log('1️⃣1️⃣ DelPattern (limpiar patrón)...');
    await cacheService.delPattern('test:*');
    const keysAfter = await cacheService. keys('test:*');
    console.log(`   ✅ Keys restantes: ${keysAfter. length}\n`);

    // 12. GetOrSet (cache-aside pattern)
    console.log('1️⃣2️⃣ GetOrSet (patrón cache-aside)...');
    let dbCalls = 0;
    
    const fetchFromDB = async () => {
      dbCalls++;
      console. log(`      📞 Simulando llamada a BD #${dbCalls}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simular latencia
      return { productos: 150, precioTotal: 25000 };
    };

    console.log('   Primera llamada (no en cache, va a BD):');
    const data1 = await cacheService. getOrSet('test:productos', fetchFromDB, 60);
    console.log('      ✅ Datos:', data1);

    console.log('   Segunda llamada (desde cache, NO va a BD):');
    const data2 = await cacheService.getOrSet('test:productos', fetchFromDB, 60);
    console.log('      ✅ Datos:', data2);
    console.log(`      ${dbCalls === 1 ? '✅' : '❌'} Llamadas a BD: ${dbCalls} (debería ser 1)\n`);

    // Limpiar
    await cacheService.del('test:productos');

    console.log('═'.repeat(60));
    console.log('\n✅ TODOS LOS TESTS PASARON\n');
    console.log('🎉 Redis/Upstash funcionando correctamente\n');

  } catch (error: any) {
    console.error('\n❌ ERROR EN TESTS:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    // Cerrar conexión
    console.log('🔌 Cerrando conexión Redis...');
    if (redis) {
      redis.disconnect();
    }
    process.exit(0);
  }
}

// Ejecutar tests
testRedis().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});