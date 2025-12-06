/**
 * ═══════════════════════════════════════════════════════════════
 * RATE LIMITER MIDDLEWARE - Protección contra spam
 * ═══════════════════════════════════════════════════════════════
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.config';

/**
 * Crear store de Redis si está disponible
 */
const createRedisStore = (prefix: string) => {
  if (!redis) return undefined;

  return new RedisStore({
    // @ts-ignore - rate-limit-redis espera sendCommand
    sendCommand: (...args: string[]) => redis.call(... args),
    prefix,
  });
};

/**
 * Rate limiter general (API pública)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes, por favor intenta más tarde.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:general:'),
});

/**
 * Rate limiter estricto (operaciones sensibles)
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 requests por hora
  message: {
    error: 'Límite de solicitudes excedido para esta operación.',
    retryAfter: '1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:strict:'),
});

/**
 * Rate limiter para autenticación
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    error: 'Demasiados intentos de inicio de sesión, intenta más tarde.',
    retryAfter: '15 minutos',
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:auth:'),
});

/**
 * Rate limiter flexible (por IP y por usuario)
 */
export const flexibleLimiter = (options: {
  windowMs?: number;
  max?: number;
  prefix?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // 1 minuto default
    max: options.max || 20, // 20 requests default
    message: {
      error: 'Límite de solicitudes excedido.',
      retryAfter: `${(options.windowMs || 60000) / 1000} segundos`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(options.prefix || 'rl:flex:'),
  });
};

/**
 * Rate limiter para WhatsApp (por número de teléfono)
 */
export class WhatsAppRateLimiter {
  private readonly windowMs: number;
  private readonly max: number;

  constructor(windowMs: number = 60000, max: number = 5) {
    this.windowMs = windowMs;
    this. max = max;
  }

  /**
   * Verificar si un número puede hacer una solicitud
   */
  async canMakeRequest(phoneNumber: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    if (!redis) {
      // Sin Redis, permitir siempre
      return {
        allowed: true,
        remaining: this.max,
        resetAt: new Date(Date.now() + this.windowMs),
      };
    }

    const key = `rl:whatsapp:${phoneNumber}`;
    const now = Date.now();

    try {
      // Incrementar contador
      const count = await redis.incr(key);

      // Si es la primera vez, setear expiración
      if (count === 1) {
        await redis. pexpire(key, this. windowMs);
      }

      // Obtener TTL
      const ttl = await redis.pttl(key);
      const resetAt = new Date(now + ttl);

      const allowed = count <= this.max;
      const remaining = Math.max(0, this.max - count);

      return { allowed, remaining, resetAt };
    } catch (error) {
      console.error('Error en WhatsApp rate limiter:', error);
      // En caso de error, permitir la solicitud
      return {
        allowed: true,
        remaining: this.max,
        resetAt: new Date(now + this.windowMs),
      };
    }
  }

  /**
   * Resetear límite para un número
   */
  async reset(phoneNumber: string): Promise<void> {
    if (!redis) return;

    const key = `rl:whatsapp:${phoneNumber}`;
    await redis.del(key);
  }

  /**
   * Obtener estado actual del límite
   */
  async getStatus(phoneNumber: string): Promise<{
    count: number;
    limit: number;
    resetAt: Date | null;
  }> {
    if (!redis) {
      return {
        count: 0,
        limit: this.max,
        resetAt: null,
      };
    }

    const key = `rl:whatsapp:${phoneNumber}`;

    try {
      const count = parseInt((await redis.get(key)) || '0');
      const ttl = await redis.pttl(key);
      const resetAt = ttl > 0 ? new Date(Date.now() + ttl) : null;

      return {
        count,
        limit: this. max,
        resetAt,
      };
    } catch (error) {
      console.error('Error obteniendo estado de rate limiter:', error);
      return {
        count: 0,
        limit: this.max,
        resetAt: null,
      };
    }
  }
}

// Exportar instancia para WhatsApp
export const whatsappLimiter = new WhatsAppRateLimiter(
  60 * 1000, // 1 minuto
  5 // 5 mensajes por minuto
);