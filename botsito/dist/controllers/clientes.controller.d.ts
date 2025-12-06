/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENTES CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
export declare class ClientesController {
    /**
     * GET /api/clientes
     */
    getAll(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/clientes/:telefono
     */
    getByTelefono(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/clientes
     */
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/clientes/:id
     */
    update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/clientes/:id
     */
    delete(req: Request, res: Response): Promise<void>;
}
declare const _default: ClientesController;
export default _default;
//# sourceMappingURL=clientes.controller.d.ts.map