"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosController = void 0;
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
class PedidosController {
    constructor() {
        this.getAll = async (req, res) => {
            try {
                const pedidos = this.readPedidos();
                res.json(pedidos);
            }
            catch (error) {
                logger_1.logger.error('Error en getAll pedidos', error);
                res.status(500).json({ error: 'Error al obtener pedidos' });
            }
        };
        this.getById = async (req, res) => {
            try {
                const { id } = req.params;
                const pedidos = this.readPedidos();
                const pedido = pedidos.find(p => p.id === id);
                if (!pedido) {
                    res.status(404).json({ error: 'Pedido no encontrado' });
                    return;
                }
                res.json(pedido);
            }
            catch (error) {
                logger_1.logger.error('Error en getById pedido', error);
                res.status(500).json({ error: 'Error al obtener pedido' });
            }
        };
        this.create = async (req, res) => {
            try {
                const pedidos = this.readPedidos();
                const nuevoPedido = {
                    id: Date.now().toString(),
                    ...req.body,
                    fechaCreacion: new Date().toISOString(),
                    fechaActualizacion: new Date().toISOString()
                };
                pedidos.push(nuevoPedido);
                this.writePedidos(pedidos);
                logger_1.logger.success('Pedido creado: ' + nuevoPedido.id);
                res.status(201).json(nuevoPedido);
            }
            catch (error) {
                logger_1.logger.error('Error en create pedido', error);
                res.status(500).json({ error: 'Error al crear pedido' });
            }
        };
        this.update = async (req, res) => {
            try {
                const { id } = req.params;
                const pedidos = this.readPedidos();
                const index = pedidos.findIndex(p => p.id === id);
                if (index === -1) {
                    res.status(404).json({ error: 'Pedido no encontrado' });
                    return;
                }
                pedidos[index] = {
                    ...pedidos[index],
                    ...req.body,
                    fechaActualizacion: new Date().toISOString()
                };
                this.writePedidos(pedidos);
                logger_1.logger.success('Pedido actualizado: ' + id);
                res.json(pedidos[index]);
            }
            catch (error) {
                logger_1.logger.error('Error en update pedido', error);
                res.status(500).json({ error: 'Error al actualizar pedido' });
            }
        };
        this.delete = async (req, res) => {
            try {
                const { id } = req.params;
                const pedidos = this.readPedidos();
                const filtered = pedidos.filter(p => p.id !== id);
                if (pedidos.length === filtered.length) {
                    res.status(404).json({ error: 'Pedido no encontrado' });
                    return;
                }
                this.writePedidos(filtered);
                logger_1.logger.success('Pedido eliminado: ' + id);
                res.json({ message: 'Pedido eliminado correctamente' });
            }
            catch (error) {
                logger_1.logger.error('Error en delete pedido', error);
                res.status(500).json({ error: 'Error al eliminar pedido' });
            }
        };
        this.pedidosFile = path_1.default.join(env_1.env.DATA_DIR, 'pedidos.json');
    }
    readPedidos() {
        try {
            if (fs_1.default.existsSync(this.pedidosFile)) {
                const data = fs_1.default.readFileSync(this.pedidosFile, 'utf8');
                return JSON.parse(data);
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Error leyendo pedidos', error);
            return [];
        }
    }
    writePedidos(pedidos) {
        try {
            fs_1.default.writeFileSync(this.pedidosFile, JSON.stringify(pedidos, null, 2), 'utf8');
        }
        catch (error) {
            logger_1.logger.error('Error escribiendo pedidos', error);
            throw error;
        }
    }
}
exports.pedidosController = new PedidosController();
//# sourceMappingURL=pedidos.%20controller.js.map