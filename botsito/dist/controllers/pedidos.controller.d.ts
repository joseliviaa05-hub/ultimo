/**
 * ═══════════════════════════════════════════════════════════════
 * PEDIDOS CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
export declare class PedidosController {
    /**
     * GET /api/pedidos
     */
    getAll(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/pedidos/:id
     */
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/pedidos
     */
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/pedidos/:id
     */
    update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/pedidos/:id
     */
    delete(req: Request, res: Response): Promise<void>;
}
declare const _default: PedidosController;
export default _default;
//# sourceMappingURL=pedidos.controller.d.ts.map