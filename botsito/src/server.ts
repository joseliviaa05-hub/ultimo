import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { env } from './config/env';
import pedidosRoutes from './routes/pedidos.routes';
import productosRoutes from './routes/productos.routes';
import clientesRoutes from './routes/clientes.routes';
import statsRoutes from './routes/stats.routes';
import whatsappRoutes from './routes/whatsapp.routes';


class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = env.PORT;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(req.method + ' ' + req.path);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date(). toISOString(),
        uptime: process.uptime()
      });
    });

    // API status
    this.app.get('/api/status', (req: Request, res: Response) => {
      res.  json({
        whatsapp: 'disconnected',
        server: 'running',
        version: '2.0.0'
      });
    });

    // API Routes
    this.app.use('/api/pedidos', pedidosRoutes);
    this.app.use('/api/productos', productosRoutes);
    this. app.use('/api/clientes', clientesRoutes);
    this.app.use('/api/stats', statsRoutes);
    this. app.use('/api/whatsapp', whatsappRoutes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Endpoint no encontrado' });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Error en servidor:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.success('Servidor Express iniciado en puerto ' + this.port);
      logger.info('Health check: http://localhost:' + this.port + '/health');
      logger.info('API Pedidos: http://localhost:' + this.port + '/api/pedidos');
      logger.info('API Productos: http://localhost:' + this.port + '/api/productos');
      logger.info('API Clientes: http://localhost:' + this.port + '/api/clientes');
      logger.info('API Stats: http://localhost:' + this.port + '/api/stats');
      logger.info('API WhatsApp: http://localhost:' + this.port + '/api/whatsapp');
    });
  }

  getApp(): Application {
    return this. app;
  }
}

// Crear e iniciar el servidor
export const server = new Server();
