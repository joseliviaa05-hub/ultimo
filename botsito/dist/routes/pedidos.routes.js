"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pedidos_controller_1 = __importDefault(require("../controllers/pedidos.controller"));
const router = (0, express_1.Router)();
// GET /api/pedidos - Listar todos los pedidos
router.get('/', pedidos_controller_1.default.getAll);
// GET /api/pedidos/:id - Obtener pedido por ID
router.get('/:id', pedidos_controller_1.default.getById);
// POST /api/pedidos - Crear nuevo pedido
router.post('/', pedidos_controller_1.default.create);
// PUT /api/pedidos/:id - Actualizar pedido
router.put('/:id', pedidos_controller_1.default.update);
// DELETE /api/pedidos/:id - Eliminar pedido
router.delete('/:id', pedidos_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=pedidos.routes.js.map