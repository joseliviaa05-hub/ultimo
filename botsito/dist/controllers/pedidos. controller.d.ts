import { Request, Response } from 'express';
declare class PedidosController {
    private pedidosFile;
    constructor();
    private readPedidos;
    private writePedidos;
    getAll: (req: Request, res: Response) => Promise<void>;
    getById: (req: Request, res: Response) => Promise<void>;
    create: (req: Request, res: Response) => Promise<void>;
    update: (req: Request, res: Response) => Promise<void>;
    delete: (req: Request, res: Response) => Promise<void>;
}
export declare const pedidosController: PedidosController;
export {};
//# sourceMappingURL=pedidos.%20controller.d.ts.map