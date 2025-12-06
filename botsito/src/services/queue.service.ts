/**
 * ═══════════════════════════════════════════════════════════════
 * QUEUE SERVICE - Gestión de tareas en background
 * ═══════════════════════════════════════════════════════════════
 */

import { Job } from 'bull';
import {
  whatsappQueue,
  cacheCleanupQueue,
  reportsQueue,
  notificationsQueue,
} from '../config/queue.config';

/**
 * Tipos de trabajos
 */
export interface WhatsAppJobData {
  phoneNumber: string;
  message: string;
  mediaUrl?: string;
  priority?: number;
}

export interface CacheCleanupJobData {
  pattern?: string;
  olderThan?: number; // milisegundos
}

export interface ReportJobData {
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  recipients: string[];
}

export interface NotificationJobData {
  type: 'pedido' | 'stock' | 'sistema';
  title: string;
  message: string;
  phoneNumbers: string[];
}

/**
 * Queue Service
 */
export class QueueService {
  /**
   * Agregar mensaje de WhatsApp a la cola
   */
  async addWhatsAppMessage(data: WhatsAppJobData): Promise<Job | null> {
    if (!whatsappQueue) {
      console.warn('⚠️ WhatsApp Queue no disponible');
      return null;
    }

    try {
      const job = await whatsappQueue.add(data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        priority: data.priority || 5,
        removeOnComplete: true,
        removeOnFail: false,
      });

      console.log(`📤 Mensaje agregado a cola: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error agregando mensaje a cola:', error);
      return null;
    }
  }

  /**
   * Programar limpieza de cache
   */
  async scheduleCacheCleanup(
    data: CacheCleanupJobData,
    cron?: string
  ): Promise<Job | null> {
    if (! cacheCleanupQueue) {
      console.warn('⚠️ Cache Cleanup Queue no disponible');
      return null;
    }

    try {
      const job = cron
        ? await cacheCleanupQueue.add(data, {
            repeat: { cron },
            removeOnComplete: true,
          })
        : await cacheCleanupQueue.add(data, {
            delay: 5000, // 5 segundos
            removeOnComplete: true,
          });

      console.log(`🧹 Limpieza de cache programada: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error programando limpieza:', error);
      return null;
    }
  }

  /**
   * Generar reporte
   */
  async generateReport(data: ReportJobData): Promise<Job | null> {
    if (! reportsQueue) {
      console.warn('⚠️ Reports Queue no disponible');
      return null;
    }

    try {
      const job = await reportsQueue.add(data, {
        attempts: 2,
        timeout: 60000, // 1 minuto
        removeOnComplete: true,
      });

      console.log(`📊 Reporte programado: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error programando reporte:', error);
      return null;
    }
  }

  /**
   * Enviar notificación
   */
  async sendNotification(data: NotificationJobData): Promise<Job | null> {
    if (! notificationsQueue) {
      console.warn('⚠️ Notifications Queue no disponible');
      return null;
    }

    try {
      const job = await notificationsQueue.add(data, {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: true,
      });

      console.log(`🔔 Notificación agregada: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Error agregando notificación:', error);
      return null;
    }
  }

  /**
   * Obtener estado de una cola
   */
  async getQueueStats(queueName: 'whatsapp' | 'cache' | 'reports' | 'notifications') {
    let queue;

    switch (queueName) {
      case 'whatsapp':
        queue = whatsappQueue;
        break;
      case 'cache':
        queue = cacheCleanupQueue;
        break;
      case 'reports':
        queue = reportsQueue;
        break;
      case 'notifications':
        queue = notificationsQueue;
        break;
    }

    if (!queue) {
      return null;
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue. getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      console.error(`Error obteniendo stats de ${queueName}:`, error);
      return null;
    }
  }

  /**
   * Limpiar jobs completados de todas las colas
   */
  async cleanCompletedJobs(olderThanMs: number = 24 * 60 * 60 * 1000) {
    const queues = [whatsappQueue, cacheCleanupQueue, reportsQueue, notificationsQueue];

    for (const queue of queues) {
      if (queue) {
        await queue.clean(olderThanMs, 'completed');
        await queue.clean(olderThanMs * 2, 'failed');
      }
    }

    console.log('✅ Jobs antiguos limpiados');
  }

  /**
   * Pausar todas las colas
   */
  async pauseAll() {
    const queues = [whatsappQueue, cacheCleanupQueue, reportsQueue, notificationsQueue];

    for (const queue of queues) {
      if (queue) {
        await queue.pause();
      }
    }

    console.log('⏸️ Todas las colas pausadas');
  }

  /**
   * Reanudar todas las colas
   */
  async resumeAll() {
    const queues = [whatsappQueue, cacheCleanupQueue, reportsQueue, notificationsQueue];

    for (const queue of queues) {
      if (queue) {
        await queue.resume();
      }
    }

    console.log('▶️ Todas las colas reanudadas');
  }
}

export default new QueueService();