import { env } from './config/env';
import { logger } from './utils/logger';
import { whatsappService } from './services/whatsapp.service';
import { server } from './server';

async function main() {
  try {
    logger.info('========================================');
    logger.info('    BOTSITOT v2. 0 - Iniciando...        ');
    logger.info('========================================');
    logger.info('Entorno: ' + env.NODE_ENV);
    logger.info('Puerto: ' + env.PORT);

    logger.info('');
    logger.info('[1/2] Inicializando WhatsApp...');
    await whatsappService.initialize();

    logger.info('');
    logger.info('[2/2] Inicializando servidor API...');
    server.start();

    logger.info('');
    logger.success('========================================');
    logger.success('  SISTEMA COMPLETO INICIADO           ');
    logger.success('  - API REST: http://localhost:' + env.PORT);
    logger.success('  - WhatsApp Bot: CONECTADO           ');
    logger. success('  - Base de datos: PostgreSQL (Neon)  ');
    logger.success('========================================');
  } catch (error) {
    logger.error('Error al iniciar BOTSITOT', error as Error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection: ' + String(reason));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main();