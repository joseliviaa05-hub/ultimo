import { Router } from 'express';
import pedidosController from '../controllers/pedidos.controller';

const router = Router();

// GET /api/pedidos - Listar todos los pedidos
router.get('/', pedidosController.getAll);

// GET /api/pedidos/:id - Obtener pedido por ID
router.get('/:id', pedidosController.getById);

// POST /api/pedidos - Crear nuevo pedido
router.post('/', pedidosController.create);

// PUT /api/pedidos/:id - Actualizar pedido
router.put('/:id', pedidosController.update);

// DELETE /api/pedidos/:id - Eliminar pedido
router.delete('/:id', pedidosController. delete);

export default router;
