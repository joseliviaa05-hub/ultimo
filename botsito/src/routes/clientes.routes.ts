import { Router } from 'express';
import clientesController from '../controllers/clientes.controller';

const router = Router();

router.get('/', clientesController.getAll. bind(clientesController));
router.get('/:telefono', clientesController.getByTelefono.bind(clientesController));
router.post('/', clientesController.create.bind(clientesController));
router. put('/:id', clientesController.update.bind(clientesController));
router.delete('/:id', clientesController.delete.bind(clientesController));

export default router;