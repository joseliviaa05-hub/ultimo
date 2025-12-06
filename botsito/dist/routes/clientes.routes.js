"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientes_controller_1 = __importDefault(require("../controllers/clientes.controller"));
const router = (0, express_1.Router)();
router.get('/', clientes_controller_1.default.getAll.bind(clientes_controller_1.default));
router.get('/:telefono', clientes_controller_1.default.getByTelefono.bind(clientes_controller_1.default));
router.post('/', clientes_controller_1.default.create.bind(clientes_controller_1.default));
router.put('/:id', clientes_controller_1.default.update.bind(clientes_controller_1.default));
router.delete('/:id', clientes_controller_1.default.delete.bind(clientes_controller_1.default));
exports.default = router;
//# sourceMappingURL=clientes.routes.js.map