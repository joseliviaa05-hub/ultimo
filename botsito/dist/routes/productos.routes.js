"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productos_controller_1 = __importDefault(require("../controllers/productos.controller"));
const router = (0, express_1.Router)();
router.get('/', productos_controller_1.default.getAll);
router.get('/:id', productos_controller_1.default.getById);
router.post('/', productos_controller_1.default.create);
router.put('/:id', productos_controller_1.default.update);
router.delete('/:id', productos_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=productos.routes.js.map