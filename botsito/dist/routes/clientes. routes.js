"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientes_controller_1 = require("../controllers/clientes.controller");
const router = (0, express_1.Router)();
router.get('/', clientes_controller_1.clientesController.getAll);
router.get('/:id', clientes_controller_1.clientesController.getById);
router.post('/', clientes_controller_1.clientesController.create);
router.put('/:id', clientes_controller_1.clientesController.update);
router.delete('/:id', clientes_controller_1.clientesController.delete);
exports.default = router;
//# sourceMappingURL=clientes.%20routes.js.map