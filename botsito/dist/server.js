"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("./utils/logger");
const env_1 = require("./config/env");
const pedidos_routes_1 = __importDefault(require("./routes/pedidos.routes"));
const productos_routes_1 = __importDefault(require("./routes/productos.routes"));
const clientes_routes_1 = __importDefault(require("./routes/clientes.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const whatsapp_routes_1 = __importDefault(require("./routes/whatsapp.routes"));
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = env_1.env.PORT;
        this.setupMiddlewares();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddlewares() {
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true
        }));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            logger_1.logger.info(req.method + ' ' + req.path);
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        // API status
        this.app.get('/api/status', (req, res) => {
            res.json({
                whatsapp: 'disconnected',
                server: 'running',
                version: '2.0.0'
            });
        });
        // API Routes
        this.app.use('/api/pedidos', pedidos_routes_1.default);
        this.app.use('/api/productos', productos_routes_1.default);
        this.app.use('/api/clientes', clientes_routes_1.default);
        this.app.use('/api/stats', stats_routes_1.default);
        this.app.use('/api/whatsapp', whatsapp_routes_1.default);
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Endpoint no encontrado' });
        });
    }
    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            logger_1.logger.error('Error en servidor:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        });
    }
    start() {
        this.app.listen(this.port, () => {
            logger_1.logger.success('Servidor Express iniciado en puerto ' + this.port);
            logger_1.logger.info('Health check: http://localhost:' + this.port + '/health');
            logger_1.logger.info('API Pedidos: http://localhost:' + this.port + '/api/pedidos');
            logger_1.logger.info('API Productos: http://localhost:' + this.port + '/api/productos');
            logger_1.logger.info('API Clientes: http://localhost:' + this.port + '/api/clientes');
            logger_1.logger.info('API Stats: http://localhost:' + this.port + '/api/stats');
            logger_1.logger.info('API WhatsApp: http://localhost:' + this.port + '/api/whatsapp');
        });
    }
    getApp() {
        return this.app;
    }
}
// Crear e iniciar el servidor
exports.server = new Server();
//# sourceMappingURL=server.js.map