/**
 * ═══════════════════════════════════════════════════════════════
 * CACHE SERVICE - Gestión de caché con Redis
 * ═══════════════════════════════════════════════════════════════
 */

import redis from '../config/redis.config';

export class CacheService {
  /**
   * Verificar si Redis está disponible
   */
  private isAvailable(): boolean {
    return redis !== null && redis.status === 'ready';
  }

  /**
   * Obtener valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cached = await redis! .get(key);
      
      if (! cached) return null;
      
      return JSON.parse(cached) as T;
    } catch (error: any) {
      console.error(`Error obteniendo cache ${key}:`, error?. message);
      return null;
    }
  }

  /**
   * Guardar en cache
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await redis!.setex(key, ttl, JSON. stringify(value));
    } catch (error: any) {
      console. error(`Error guardando cache ${key}:`, error?.message);
    }
  }

  /**
   * Eliminar del cache
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await redis!.del(key);
    } catch (error: any) {
      console.error(`Error eliminando cache ${key}:`, error?.message);
    }
  }

  /**
   * Eliminar múltiples keys por patrón
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const keys = await redis!.keys(pattern);
      
      if (keys.length > 0) {
        await redis!.del(... keys);
      }
    } catch (error: any) {
      console.error(`Error eliminando patrón ${pattern}:`, error?.message);
    }
  }

  /**
   * Verificar si existe en cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await redis!. exists(key);
      return result === 1;
    } catch (error: any) {
      console.error(`Error verificando cache ${key}:`, error?.message);
      return false;
    }
  }

  /**
   * Obtener o calcular (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Si Redis no está disponible, ejecutar función directamente
    if (!this.isAvailable()) {
      return await fetchFn();
    }

    // Intentar obtener del cache
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Si no está en cache, calcular
    const value = await fetchFn();

    // Guardar en cache (fire and forget)
    this.set(key, value, ttl). catch(() => {
      // Ignorar errores de escritura en cache
    });

    return value;
  }

  /**
   * Incrementar contador
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const value = await redis!.incr(key);
      
      if (ttl && value === 1) {
        await redis!. expire(key, ttl);
      }

      return value;
    } catch (error: any) {
      console.error(`Error incrementando ${key}:`, error?.message);
      return 0;
    }
  }

  /**
   * Decrementar contador
   */
  async decr(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      return await redis!.decr(key);
    } catch (error: any) {
      console.error(`Error decrementando ${key}:`, error?.message);
      return 0;
    }
  }

  /**
   * Obtener TTL restante
   */
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      return await redis!. ttl(key);
    } catch (error: any) {
      console.error(`Error obteniendo TTL ${key}:`, error?.message);
      return -1;
    }
  }

  /**
   * Establecer expiración a una key existente
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this. isAvailable()) {
      return false;
    }

    try {
      const result = await redis!.expire(key, ttl);
      return result === 1;
    } catch (error: any) {
      console.error(`Error estableciendo expiración ${key}:`, error?.message);
      return false;
    }
  }

  /**
   * Limpiar todo el cache (usar con cuidado)
   */
  async flush(): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Redis no disponible, no se puede limpiar cache');
      return;
    }

    try {
      await redis!.flushdb();
      console.log('✅ Cache limpiado completamente');
    } catch (error: any) {
      console.error('Error limpiando cache:', error?.message);
    }
  }

  /**
   * Ping para verificar conexión
   */
  async ping(): Promise<boolean> {
    if (!this. isAvailable()) {
      return false;
    }

    try {
      const result = await redis!.ping();
      return result === 'PONG';
    } catch (error: any) {
      console.error('Error en ping:', error?.message);
      return false;
    }
  }

  /**
   * Obtener información de Redis
   */
  async info(): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await redis!.info();
    } catch (error: any) {
      console.error('Error obteniendo info:', error?.message);
      return null;
    }
  }

  /**
   * Obtener todas las keys que coinciden con un patrón
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return await redis!.keys(pattern);
    } catch (error: any) {
      console.error(`Error obteniendo keys ${pattern}:`, error?.message);
      return [];
    }
  }

  /**
   * Guardar hash
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this. isAvailable()) {
      return;
    }

    try {
      await redis!.hset(key, field, value);
    } catch (error: any) {
      console.error(`Error guardando hash ${key}:`, error?.message);
    }
  }

  /**
   * Obtener valor de hash
   */
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await redis!.hget(key, field);
    } catch (error: any) {
      console.error(`Error obteniendo hash ${key}:`, error?.message);
      return null;
    }
  }

  /**
   * Obtener todo el hash
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isAvailable()) {
      return {};
    }

    try {
      return await redis!.hgetall(key);
    } catch (error: any) {
      console.error(`Error obteniendo hash completo ${key}:`, error?. message);
      return {};
    }
  }

  /**
   * Agregar a una lista
   */
  async lpush(key: string, ... values: string[]): Promise<number> {
    if (!this. isAvailable()) {
      return 0;
    }

    try {
      return await redis! .lpush(key, ...values);
    } catch (error: any) {
      console.error(`Error agregando a lista ${key}:`, error?.message);
      return 0;
    }
  }

  /**
   * Obtener rango de una lista
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return await redis!.lrange(key, start, stop);
    } catch (error: any) {
      console.error(`Error obteniendo rango de lista ${key}:`, error?. message);
      return [];
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats(): { available: boolean; status: string } {
    return {
      available: this.isAvailable(),
      status: redis?. status || 'disconnected',
    };
  }
}

export default new CacheService();