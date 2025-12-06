/**
 * ═══════════════════════════════════════════════════════════════
 * REDIS CONFIGURATION - UPSTASH
 * ═══════════════════════════════════════════════════════════════
 */

import './env'; // ⚠️ Cargar env primero para que dotenv. config() se ejecute
import Redis from 'ioredis';

// Leer REDIS_URL después de que env.ts cargó dotenv
const redisUrl = process.env. REDIS_URL;

let redis: Redis | null = null;
let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

if (redisUrl) {
  console.log('🔧 Configurando Redis/Upstash...');
  console.log(`   URL: ${redisUrl. replace(/:([^@]+)@/, ':****@')}`);

  const redisConfig = {
    tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    connectTimeout: 10000,
    lazyConnect: true, // No conectar hasta que se use explícitamente
    retryStrategy(times: number) {
      if (times > 3) {
        console.error('❌ Redis: Máximo de reintentos alcanzado');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      console.log(`⚠️ Redis: Reintento ${times} en ${delay}ms`);
      return delay;
    },
  };

  try {
    // Cliente Redis principal
    redis = new Redis(redisUrl, redisConfig);

    // Clientes para Bull (pub/sub)
    redisClient = new Redis(redisUrl, redisConfig);
    redisSubscriber = new Redis(redisUrl, redisConfig);

    // Event handlers
    redis.on('connect', () => {
      console. log('🔌 Redis conectando...');
    });

    redis.on('ready', () => {
      console. log('✅ Redis listo para usar');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err. message);
    });

    redis.on('close', () => {
      console.warn('⚠️ Redis conexión cerrada');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis reconectando...');
    });

  } catch (error: any) {
    console.error('❌ Error inicializando Redis:', error.message);
    redis = null;
    redisClient = null;
    redisSubscriber = null;
  }
} else {
  console.warn('⚠️ REDIS_URL no configurado.  Cache deshabilitado.');
  console.warn('   El sistema funcionará sin cache (más lento).');
}

export { redis, redisClient, redisSubscriber };
export default redis;