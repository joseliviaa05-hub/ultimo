/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTOS CONTROLLER - Con Prisma
 * ═══════════════════════════════════════════════════════════════
 */
import { Request, Response } from 'express';
export declare class ProductosController {
    /**
     * GET /api/productos
     */
    getAll(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/productos/:id
     */
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/productos
     */
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/productos/:id
     */
    update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/productos/:id
     */
    delete(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/productos/categoria/:categoria
     */
    getByCategoria(req: Request, res: Response): Promise<void>;
}
declare const _default: ProductosController;
export default _default;
//# sourceMappingURL=productos.controller.d.ts.map