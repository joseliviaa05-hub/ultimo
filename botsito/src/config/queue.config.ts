/**
 * ═══════════════════════════════════════════════════════════════
 * QUEUE CONFIGURATION - Bull con Redis
 * ═══════════════════════════════════════════════════════════════
 */

import Bull from 'bull';
import { redis, redisClient, redisSubscriber } from './redis.config';

// Configuración de Bull
const bullConfig = redis
  ? {
      createClient: (type: 'client' | 'subscriber' | 'bclient') => {
        switch (type) {
          case 'client':
            return redisClient! ;
          case 'subscriber':
            return redisSubscriber! ;
          case 'bclient':
            return redisClient! . duplicate();
          default:
            return redisClient!;
        }
      },
      prefix: 'bull',
    }
  : undefined;

/**
 * Cola para mensajes de WhatsApp
 */
export const whatsappQueue = bullConfig
  ? new Bull('whatsapp-messages', bullConfig)
  : null;

/**
 * Cola para limpieza de cache
 */
export const cacheCleanupQueue = bullConfig
  ? new Bull('cache-cleanup', bullConfig)
  : null;

/**
 * Cola para reportes
 */
export const reportsQueue = bullConfig
  ?  new Bull('reports', bullConfig)
  : null;

/**
 * Cola para notificaciones
 */
export const notificationsQueue = bullConfig
  ?  new Bull('notifications', bullConfig)
  : null;

// Event handlers para debugging
if (whatsappQueue) {
  whatsappQueue.on('completed', (job) => {
    console.log(`✅ Job WhatsApp ${job.id} completado`);
  });

  whatsappQueue.on('failed', (job, err) => {
    console.error(`❌ Job WhatsApp ${job?. id} falló:`, err. message);
  });

  whatsappQueue.on('stalled', (job) => {
    console.warn(`⚠️ Job WhatsApp ${job. id} atascado`);
  });
}

if (cacheCleanupQueue) {
  cacheCleanupQueue.on('completed', (job) => {
    console.log(`✅ Limpieza de cache ${job.id} completada`);
  });

  cacheCleanupQueue.on('failed', (job, err) => {
    console.error(`❌ Limpieza de cache ${job?.id} falló:`, err.message);
  });
}

// Limpiar jobs completados después de 24 horas
if (whatsappQueue) {
  whatsappQueue.clean(24 * 60 * 60 * 1000, 'completed');
  whatsappQueue.clean(48 * 60 * 60 * 1000, 'failed');
}

console.log(
  bullConfig
    ? '✅ Bull Queues configuradas'
    : '⚠️ Bull Queues deshabilitadas (Redis no disponible)'
);

export default {
  whatsappQueue,
  cacheCleanupQueue,
  reportsQueue,
  notificationsQueue,
};