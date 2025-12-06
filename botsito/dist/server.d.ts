import { Application } from 'express';
declare class Server {
    private app;
    private port;
    constructor();
    private setupMiddlewares;
    private setupRoutes;
    private setupErrorHandling;
    start(): void;
    getApp(): Application;
}
export declare const server: Server;
export {};
//# sourceMappingURL=server.d.ts.map