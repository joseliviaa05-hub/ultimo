"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const whatsapp_service_1 = require("./services/whatsapp.service");
const server_1 = require("./server");
async function main() {
    try {
        logger_1.logger.info('========================================');
        logger_1.logger.info('    BOTSITOT v2. 0 - Iniciando...        ');
        logger_1.logger.info('========================================');
        logger_1.logger.info('Entorno: ' + env_1.env.NODE_ENV);
        logger_1.logger.info('Puerto: ' + env_1.env.PORT);
        logger_1.logger.info('');
        logger_1.logger.info('[1/2] Inicializando WhatsApp...');
        await whatsapp_service_1.whatsappService.initialize();
        logger_1.logger.info('');
        logger_1.logger.info('[2/2] Inicializando servidor API...');
        server_1.server.start();
        logger_1.logger.info('');
        logger_1.logger.success('========================================');
        logger_1.logger.success('  SISTEMA COMPLETO INICIADO           ');
        logger_1.logger.success('  - API REST: http://localhost:' + env_1.env.PORT);
        logger_1.logger.success('  - WhatsApp Bot: CONECTADO           ');
        logger_1.logger.success('  - Base de datos: PostgreSQL (Neon)  ');
        logger_1.logger.success('========================================');
    }
    catch (error) {
        logger_1.logger.error('Error al iniciar BOTSITOT', error);
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection: ' + String(reason));
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
main();
//# sourceMappingURL=index.js.map