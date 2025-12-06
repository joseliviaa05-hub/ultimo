/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTOS ROUTES - Con rate limiting y cache
 * ═══════════════════════════════════════════════════════════════
 */

import { Router } from 'express';
import productosController from '../controllers/productos.controller';
import { generalLimiter, flexibleLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Rate Limiter General (todas las rutas)
// ─────────────────────────────────────────────────────────────
router.use(generalLimiter);

// ─────────────────────────────────────────────────────────────
// RUTAS DE LECTURA (más permisivas)
// ─────────────────────────────────────────────────────────────

/**
 * GET /productos
 * Obtener todos los productos (paginado)
 * Rate limit: 50 requests/minuto
 */
router.get(
  '/',
  flexibleLimiter({ 
    windowMs: 60 * 1000, // 1 minuto
    max: 50, 
    prefix: 'rl:productos:getAll:' 
  }),
  productosController.getAll
);

/**
 * GET /productos/:id
 * Obtener producto por ID
 * Rate limit: 60 requests/minuto
 */
router.get(
  '/:id',
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 60, 
    prefix: 'rl:productos:getById:' 
  }),
  productosController.getById
);

// ─────────────────────────────────────────────────────────────
// RUTAS DE ESCRITURA (más restrictivas)
// ─────────────────────────────────────────────────────────────

/**
 * POST /productos
 * Crear nuevo producto
 * Rate limit: 10 requests/minuto (prevenir spam)
 */
router.post(
  '/',
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 10, 
    prefix: 'rl:productos:create:' 
  }),
  productosController.create
);

/**
 * PUT /productos/:id
 * Actualizar producto existente
 * Rate limit: 20 requests/minuto
 */
router.put(
  '/:id',
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 20, 
    prefix: 'rl:productos:update:' 
  }),
  productosController.update
);

/**
 * DELETE /productos/:id
 * Eliminar producto
 * Rate limit: 5 requests/minuto (operación crítica)
 */
router. delete(
  '/:id',
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 5, 
    prefix: 'rl:productos:delete:' 
  }),
  productosController.delete
);

export default router;